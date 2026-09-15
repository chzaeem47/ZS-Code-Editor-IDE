import express from 'express'
import { createProject, deleteProject, getProjectById, getProjects, getStarredProjects, toggleStar } from '../controllers/project.controller.js'

const router = express.Router()

/*
* CREATE PROJECT ROUTE
* - /api/project/createProject
*/
router.post('/',createProject)

/*
* GET ALL PROJECTS ROUTE
* - /api/project/
*/
router.get('/',getProjects)

/*
* GET ALL STARRED PROJECT ROUTE
* - /api/project/starred
*/
router.get('/starred',getStarredProjects)

/*
* GET PROJECT BY ID
* FOR NOW NOT USED IN FRONTEND
* - /api/project/:id
*/
router.get('/:id',getProjectById)

/*
* TOGGLE STAR ON ID
* - /api/project/:id
*/
router.patch('/:id',toggleStar)

/*
* DELETE PROJECT BY ID ROUTE
* - /api/project/:id
*/
router.delete('/:id',deleteProject)

export default router;

