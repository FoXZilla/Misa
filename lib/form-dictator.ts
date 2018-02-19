interface CheckRecord<T>{
    key :keyof T;
    value:any;
    checker:(value:any)=>boolean|Promise<boolean>;
    result :boolean|Promise<boolean>;
};

export default class FormDictator<T>{
    public _results:CheckRecord<T>[] =[];
    constructor(public data:T){};
    pick(keys:(keyof T)[]){
        var newData =Object.create(null);
        for(let key of keys){
            if(!(key in this.data))continue;
            newData[key] =this.data[key];
        }
        return this.clone(newData);
    };
    noUndefined(){
        var newData =Object.create(null);
        for(let key in this.data){
            if(this.data[key]===undefined)continue;
            newData[key] =this.data[key];
        }
        return this.clone(newData);
    };
    noNull(){
        var newData =Object.create(null);
        for(let key in this.data){
            if(this.data[key]===null)continue;
            newData[key] =this.data[key];
        }
        return this.clone(newData);
    };
    noEmpty(){
        return this.noNull().noUndefined();
    };
    changeIfExist(beChangeKey:(keyof T),changer:(value:any)=>any){
        if(!(beChangeKey in this.data)){
            return this.clone();
        };
        var newData =Object.create(null);
        for(let key in this.data){
            newData[key] =this.data[key];
        }
        if(beChangeKey in this.data) newData[beChangeKey] =changer(newData[beChangeKey]);
        return this.clone(newData);
    }
    require(key:(keyof T)){
        this._results.push({
            key,
            value :this.data[key],
            checker:function require(){return false},
            result :key in this.data,
        });
        return this.clone();
    }
    check(key:(keyof T),checker:CheckRecord<T>['checker']){
        this._results.push({
            key,
            value :this.data[key],
            checker,
            result :checker(this.data[key]),
        });
        return this.clone();
    };
    checkIfExist(key:(keyof T),checker:CheckRecord<T>['checker']){
        if(!(key in this.data))this._results.push({
            key,
            value :undefined,
            checker,
            result :true,
        });
        // @ts-ignore
        else this.check(...arguments);
        return this.clone();
    };
    clone(data:any=this.data){
        var fd =new FormDictator(data as T);
        fd._results =Array.from(this._results);
        return fd;
    };
    async waitResult(){
        await Promise.all(this._results.map(r=>r.result));
        for(let resultObj of this._results){
            resultObj.result =await resultObj.result
        };
        return this.clone();
    };
    hasFail():boolean{
        return this._results.some(r=>r.result===false)
    };
    witchFail():(keyof T)|null{
        var target =this._results.find(r=>r.result===false);
        return target?target.key:null;
    }
    static diff(origin:any ,update:any){
        var diff =Object.create(null);
        for(let key in update){
            if(typeof update[key]==='object'){
                diff[key] =FormDictator.diff(origin[key],update[key]);
                if(Object.keys(diff[key]).length===0) delete diff[key];
                else if(Array.isArray(update[key])){
                    diff[key].length =Object.keys(diff[key]).length;
                }
            }else if(origin[key]!==update[key]){
                diff[key] =origin[key];
            };
        };
        return diff;
    }
}

