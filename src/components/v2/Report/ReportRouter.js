import { Router } from 'express';
import * as controller from './ReportController';
import { throwAsNext } from '../../../libs';

// import subrouter
// ...
const path = '/reports';
const router = Router();

// route
router.get('/', throwAsNext(controller.getAllReportReasons));

// registerSubrouter

// export
export default { path, router };
