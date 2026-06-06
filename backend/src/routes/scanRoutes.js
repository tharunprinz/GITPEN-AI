import express from 'express';
import {
  scanRepository,
  getScanHistory,
  getScanDetails,
  getScanFileContent
} from '../controllers/scanController.js';

const router = express.Router();

router.post('/', scanRepository);
router.get('/history', getScanHistory);
router.get('/:id', getScanDetails);
router.get('/:id/file', getScanFileContent);

export default router;
