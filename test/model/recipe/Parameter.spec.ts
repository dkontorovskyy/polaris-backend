/*
 * MIT License
 *
 * Copyright (c) 2019 Markus Graube <markus.graube@tu.dresden.de>,
 * Chair for Process Control Systems, Technische Universität Dresden
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {expect} from 'chai';
import * as fs from 'fs';
import {Module} from '../../../src/model/core/Module';
import {Service} from '../../../src/model/core/Service';
import {Parameter} from '../../../src/model/recipe/Parameter';
import {ModuleTestServer} from '../../../src/moduleTestServer/ModuleTestServer';

describe('Parameter', () => {

    context('static', () => {
        let service: Service;
        let module: Module;

        before(() => {
            const file = fs.readFileSync('assets/modules/module_cif.json');

            module = new Module(JSON.parse(file.toString()).modules[0]);
            service = module.services[0];
        });

        it('should load', () => {
            const param = new Parameter({
                name: 'var1',
                value: 3
            }, service);
        });

        it('should load with expression', async () => {
            const param = new Parameter({
                name: 'var1',
                value: '3+2'
            }, service);
            expect(await param.getValue()).to.equal(5);
        });

        it('should load with complex expression', async () => {
            const param = new Parameter({
                name: 'var1',
                value: 'sin(3)+2'
            }, service);
            expect(await param.getValue()).to.be.closeTo(2.14, 0.01);
        });

        it('should fail with wrong parameter name', () => {
            expect(() => {
                const param = new Parameter({
                    name: 'non-existing-parameter',
                    value: 3
                }, service);
            }).to.throw();
        });
    });

    context('with ModuleTestServer', () => {
        let service: Service;
        let module: Module;
        let moduleServer: ModuleTestServer;

        before(async () => {
            moduleServer = new ModuleTestServer();
            await moduleServer.start();
            const moduleJson = JSON.parse(fs.readFileSync('assets/modules/module_testserver_1.0.0.json', 'utf8'))
                .modules[0];
            module = new Module(moduleJson);
            service = module.services[0];
            await module.connect();
        });

        after(async () => {
            await module.disconnect();
            await moduleServer.shutdown();
        });

        it('should load with complex expression and given scopeArray', async () => {
            const param = new Parameter({
                name: 'Parameter001',
                value: 'sin(a)^2 + cos(CIF.Variable001)^2',
                scope: [
                    {
                        name: 'a',
                        module: 'CIF',
                        dataAssembly: 'Variable001',
                        variable: 'V'
                    }
                ]

            }, service, undefined, [module]);
            expect(await param.getValue()).to.be.closeTo(1, 0.01);
        });

        it('should load with complex expression with dataAssembly variables', async () => {
            const param = new Parameter({
                name: 'Parameter001',
                value: '2 * CIF.Variable001.V + CIF.Variable002 + Variable\\.003'
            }, service, undefined, [module]);
            expect(await param.getValue()).to.be.greaterThan(0.01);
        });

    });

});
