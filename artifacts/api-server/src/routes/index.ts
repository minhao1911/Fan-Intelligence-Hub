import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import nationsRouter from "./nations";
import matchesRouter from "./matches";
import discussionsRouter from "./discussions";
import statsRouter from "./stats";
import fixturesRouter from "./fixtures";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(nationsRouter);
router.use(matchesRouter);
router.use(discussionsRouter);
router.use(statsRouter);
router.use(fixturesRouter);

export default router;
