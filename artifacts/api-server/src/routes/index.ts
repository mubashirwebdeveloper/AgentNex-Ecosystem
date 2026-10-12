import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import organizationRouter from "./organizations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(organizationRouter);

export default router;
