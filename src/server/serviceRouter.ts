import {recipe_manager} from '../model/RecipeManager';
import {ServiceCommand} from "../model/enum";
import {moduleRouter} from "./moduleRouter";
import {Request, Response, Router} from "express";
import * as asyncHandler from 'express-async-handler';
import {Strategy} from "../model/Interfaces";
import {Parameter} from "../model/Parameter";

export const serviceRouter: Router = Router();


/**
 * @api {post} /module/:moduleId/service/:serviceName/:command    Call service
 * @apiName CallService
 * @apiGroup Service
 * @apiParam {string} moduleId      Module id
 * @apiParam {string} serviceName   Name of service
 * @apiParam {string="start","stop","abort","complete"} command       Command name
 * @apiParam {string} [strategy]    Strategy name
 * @apiParam {Object[]} [parameters]    Parameters for *start* or *restart*
 */
moduleRouter.post('/:moduleId/service/:serviceName/:command', asyncHandler(async (req: Request, res: Response) => {
    const module = await recipe_manager.modules.find(module => module.id === req.params.moduleId);
    const service = await module.services.find(service => service.name === req.params.serviceName);
    const command: ServiceCommand = req.params.command;

    let strategy: Strategy = null;
    let parameters: Parameter[] = [];
    if (req.params.strategy) {
        strategy = service.strategies.find(strat => strat.name === req.params.strategy);
    } else {
        strategy = service.strategies.find(strat => strat.default === true);
    }

    if (req.params.parameters) {
        parameters = req.params.parameters;
    }

    const result = await service.executeCommand(command, strategy, parameters);
    res.send("Command succesfully send: " + result);
}));


/**
 * @api {get} /module/:moduleId/service/:serviceName/    Get service status
 * @apiName GetService
 * @apiGroup Service
 * @apiParam {string} moduleId      Module id
 * @apiParam {string} serviceName   Name of service
 */
moduleRouter.get('/:moduleId/service/:serviceName', asyncHandler(async (req: Request, res: Response) => {
    const module = await recipe_manager.modules.find(module => module.id === req.params.moduleId);
    if (!module) {
        throw new Error(`Module with id ${req.params.moduleId} not registered`);
    }
    const service = await module.services.find(service => service.name === req.params.serviceName);
    res.json(await service.getOverview());
}));