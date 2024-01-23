const express = require('express');
const router = express.Router();
const { updateRoutineActivity, canEditRoutineActivity, destroyRoutineActivity, getRoutineActivityById, getAllRoutineActivities, createRoutineActivity } = require('../db');
const client = require('../db/client');
const { requireUser, requiredNotSent } = require('./utils')


// GET /api/routine_activities
router.get('/', async (req, res, next) => {
  try {
    const allRoutineActivities = await getAllRoutineActivities(); 
    res.send(allRoutineActivities);
  } catch (error) {
    next(error);
  }
});

// GET /api/routine_activities/:routineActivityId
router.get('/:routineActivityId', async (req, res, next) => {
  try {
    const { routineActivityId } = req.params;
    const routineActivity = await getRoutineActivityById(routineActivityId);

    if (!routineActivity) {
      next({
        name: 'NotFound',
        message: `No routine_activity found by ID ${routineActivityId}`
      });
    } else {
      res.send(routineActivity);
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/routine_activities
router.post('/', requireUser, requiredNotSent({ requiredParams: ['count', 'duration'], atLeastOne: true }), async (req, res, next) => {
  try {
    const { routineId, activityId, count, duration } = req.body;

    // Create a new routine activity associated with the authenticated user
    const newRoutineActivity = await createRoutineActivity({
      routineId,
      activityId,
      count,
      duration,
    });

    res.status(201).send(newRoutineActivity);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/routine_activities/:routineActivityId
router.patch('/:routineActivityId', requireUser, requiredNotSent({requiredParams: ['count', 'duration'], atLeastOne: true}), async (req, res, next) => {
  try {
    const {count, duration} = req.body;
    const {routineActivityId} = req.params;
    const routineActivityToUpdate = await getRoutineActivityById(routineActivityId);
    if(!routineActivityToUpdate) {
      next({
        name: 'NotFound',
        message: `No routine_activity found by ID ${routineActivityId}`
      })
    } else {
      if(!await canEditRoutineActivity(req.params.routineActivityId, req.user.id)) {
        res.status(403);
        next({name: "Unauthorized", message: "You cannot edit this routine_activity!"});
      } else {
        const updatedRoutineActivity = await updateRoutineActivity({id: req.params.routineActivityId, count, duration})
        res.send(updatedRoutineActivity);
      }
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/routine_activities/:routineActivityId
router.delete('/:routineActivityId', requireUser, async (req, res, next) => {
  try {
    if(!await canEditRoutineActivity(req.params.routineActivityId, req.user.id)) {
      res.status(403);
      next({name: "Unauthorized", message: "You cannot edit this routine_activity!"});
    } else {
      const deletedRoutineActivity = await destroyRoutineActivity(req.params.routineActivityId)
      res.send({success: true, ...deletedRoutineActivity});
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
