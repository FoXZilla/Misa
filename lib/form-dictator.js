"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
class FormDictator {
    constructor(data) {
        this.data = data;
        this._results = [];
    }
    ;
    pick(keys) {
        var newData = Object.create(null);
        for (let key of keys) {
            //@ts-ignore
            if (!(key in this.data))
                continue;
            //@ts-ignore
            newData[key] = this.data[key];
        }
        return this.clone(newData);
    }
    ;
    noUndefined() {
        var newData = Object.create(null);
        for (let key in this.data) {
            if (this.data[key] === undefined)
                continue;
            newData[key] = this.data[key];
        }
        return this.clone(newData);
    }
    ;
    noNull() {
        var newData = Object.create(null);
        for (let key in this.data) {
            if (this.data[key] === null)
                continue;
            newData[key] = this.data[key];
        }
        return this.clone(newData);
    }
    ;
    noEmpty() {
        return this.noNull().noUndefined();
    }
    ;
    changeIfExist(beChangeKey, changer) {
        if (!(beChangeKey in this.data)) {
            return this.clone();
        }
        ;
        var newData = Object.create(null);
        for (let key in this.data) {
            newData[key] = this.data[key];
        }
        if (beChangeKey in this.data)
            newData[beChangeKey] = changer(newData[beChangeKey]);
        return this.clone(newData);
    }
    require(key) {
        this._results.push({
            key,
            value: this.data[key],
            checker: function require() { return false; },
            result: key in this.data,
        });
        return this.clone();
    }
    check(key, checker) {
        this._results.push({
            key,
            value: this.data[key],
            checker,
            result: checker(this.data[key]),
        });
        return this.clone();
    }
    ;
    checkIfExist(key, checker) {
        if (!(key in this.data))
            this._results.push({
                key,
                value: undefined,
                checker,
                result: true,
            });
        else
            this.check(...arguments);
        return this.clone();
    }
    ;
    clone(data = this.data) {
        var fd = new FormDictator(data);
        //@ts-ignore
        fd._results = Array.from(this._results);
        return fd;
    }
    ;
    async waitResult() {
        await Promise.all(this._results.map(r => r.result));
        for (let resultObj of this._results) {
            resultObj.result = await resultObj.result;
        }
        ;
        return this.clone();
    }
    ;
    hasFail() {
        return this._results.some(r => r.result === false);
    }
    ;
    witchFail() {
        var target = this._results.find(r => r.result === false);
        return target ? target.key : null;
    }
    static diff(origin, update) {
        var diff = Object.create(null);
        for (let key in update) {
            if (typeof update[key] === 'object') {
                diff[key] = FormDictator.diff(origin[key], update[key]);
                if (Object.keys(diff[key]).length === 0)
                    delete diff[key];
                else if (Array.isArray(update[key])) {
                    diff[key].length = Object.keys(diff[key]).length;
                }
            }
            else if (origin[key] !== update[key]) {
                diff[key] = origin[key];
            }
            ;
        }
        ;
        return diff;
    }
}
exports.default = FormDictator;
