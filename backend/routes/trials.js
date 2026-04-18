const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const { optionalAuth } = require('../middleware/auth');

const cache = new NodeCache({ stdTTL: 600 });
const CT_BASE = 'https://clinicaltrials.gov/api/v2';

// GET /api/trials/search
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const {
      query, page = 1, limit = 10,
      status, phase, condition, location, ageGroup, sponsor
    } = req.query;

    const cacheKey = `trials_${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const params = {
      format: 'json',
      pageSize: parseInt(limit),
      pageToken: page > 1 ? undefined : undefined,
      countTotal: true
    };

    // Build query
    const queryParts = [];
    if (query) queryParts.push(query);
    if (condition) queryParts.push(condition);

    if (queryParts.length > 0) params['query.term'] = queryParts.join(' AND ');
    if (status) params['filter.overallStatus'] = status;
    if (phase) params['filter.phase'] = phase;
    if (location) params['query.locn'] = location;

    const response = await axios.get(`${CT_BASE}/studies`, { params, timeout: 10000 });

    const studies = response.data.studies || [];
    const total = response.data.totalCount || 0;

    const trials = studies.map(study => {
      const proto = study.protocolSection;
      const id = proto?.identificationModule;
      const status = proto?.statusModule;
      const desc = proto?.descriptionModule;
      const eligibility = proto?.eligibilityModule;
      const contacts = proto?.contactsLocationsModule;
      const design = proto?.designModule;
      const conditions = proto?.conditionsModule;
      const interventions = proto?.armsInterventionsModule;
      const sponsors = proto?.sponsorCollaboratorsModule;

      const locations = contacts?.locations?.slice(0, 5)?.map(loc => ({
        facility: loc.facility,
        city: loc.city,
        state: loc.state,
        country: loc.country,
        status: loc.status
      })) || [];

      // Extract contact information (spec requirement)
      const centralContacts = (contacts?.centralContacts || []).slice(0, 3).map(c => ({
        name: c.name || '',
        role: c.role || '',
        phone: c.phone || '',
        phoneExt: c.phoneExt || '',
        email: c.email || ''
      }));

      const locationContacts = (contacts?.locations || []).slice(0, 3).reduce((acc, loc) => {
        const lc = (loc.contacts || []).slice(0, 2).map(c => ({
          name: c.name || '',
          role: c.role || '',
          phone: c.phone || '',
          email: c.email || '',
          facility: loc.facility || '',
          city: loc.city || '',
          country: loc.country || ''
        }));
        return [...acc, ...lc];
      }, []);

      const allContacts = [...centralContacts, ...locationContacts].slice(0, 5);

      return {
        nctId: id?.nctId || '',
        title: id?.briefTitle || id?.officialTitle || 'No title',
        officialTitle: id?.officialTitle || '',
        status: status?.overallStatus || 'Unknown',
        phase: design?.phases?.join(', ') || 'N/A',
        conditions: conditions?.conditions || [],
        interventions: interventions?.interventions?.slice(0, 3)?.map(i => ({
          type: i.type,
          name: i.name
        })) || [],
        brief_summary: desc?.briefSummary || 'No summary available',
        detailed_description: desc?.detailedDescription || '',
        eligibility: {
          criteria: eligibility?.eligibilityCriteria || '',
          healthyVolunteers: eligibility?.healthyVolunteers,
          sex: eligibility?.sex,
          minAge: eligibility?.minimumAge,
          maxAge: eligibility?.maximumAge
        },
        sponsors: sponsors?.leadSponsor?.name || '',
        locations,
        enrollment: design?.enrollmentInfo?.count || null,
        startDate: status?.startDateStruct?.date || '',
        completionDate: status?.completionDateStruct?.date || '',
        primaryCompletion: status?.primaryCompletionDateStruct?.date || '',
        contacts: allContacts,
        url: `https://clinicaltrials.gov/study/${id?.nctId}`,
        source: 'ClinicalTrials.gov'
      };
    });

    const result = {
      trials,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    };

    cache.set(cacheKey, result);
    res.json(result);

  } catch (error) {
    console.error('ClinicalTrials error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch clinical trials',
      details: error.message
    });
  }
});

// GET /api/trials/:nctId
router.get('/:nctId', async (req, res) => {
  try {
    const { nctId } = req.params;
    const cacheKey = `trial_${nctId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await axios.get(`${CT_BASE}/studies/${nctId}`, {
      params: { format: 'json' }
    });

    cache.set(cacheKey, response.data, 3600);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trial details' });
  }
});

module.exports = router;
