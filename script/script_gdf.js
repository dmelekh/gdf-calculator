
function getArgByHalfMethod(fun, trgtFunVal, xLimLeft, xLimRight, accuracy) {
    let acc = accuracy !== undefined ? accuracy : 1e-9;
    let yLeft = fun(xLimLeft),
        yRight = fun(xLimRight);
    if (Math.abs(trgtFunVal - yLeft) < acc) {
        return xLimLeft;
    }
    if (Math.abs(trgtFunVal - yRight) < acc) {
        return xLimRight;
    }
    let xLeft = xLimLeft,
        xRight = xLimRight,
        x, y;
    while (Math.abs(xRight - xLeft) > acc) {
        x = (xLeft + xRight) * 0.5;
        y = fun(x);
        if ((y - trgtFunVal) * (yRight - trgtFunVal) < 0) {
            xLeft = x;
            continue;
        }
        //        if ((yLeft - trgtFunVal)*(y - trgtFunVal) < 0) {} - TODO if not, throw Exception
        xRight = x;
    }
    return (xLeft + xRight) * 0.5;
}


function splitElementsBy(elementFieldName, elements) {
    //    let elementsByClassNames = new Map();
    let fieldValueVsElement = new Map();
    for (let element of elements) {
        //        elementsByClassNames.set(item.name, item);
        fieldValueVsElement.set(element[elementFieldName], element);
    }
    return fieldValueVsElement;
}

class GasStateByMach {
    constructor() {
        this.kappa = 1.4;
        this.mach = 1.0;
    }

    getArgMin() {
        return 0.0;
    }

    getArgMax() {
        return Infinity;
    }

    setArgument(mach) {
        this.mach = +mach;
    }
    
    getArgFieldName() {
        return 'mach';
    }
    
    getMach() {
        return this.mach;
    }

    getQu() {
        return Math.pow((this.kappa + 1.0) / 2.0, 1.0 / (this.kappa - 1.0)) * this.getLambda() * Math.pow(1.0 - (this.kappa - 1.0) / (this.kappa + 1.0) * Math.pow(this.getLambda(), 2.0), 1.0 / (this.kappa - 1.0));
    }

    getLambda() {
        //        return Math.sqrt(Math.pow(this.mach,2.)*(this.kappa+1.)/2./(1.+(this.kappa-1.)/2.*Math.pow(this.mach,2.)));
        return Math.sqrt(Math.pow(this.mach, 2) * (this.kappa + 1) / 2 / (1 + (this.kappa - 1) / 2 * Math.pow(this.mach, 2)));
    }

    getPi() {
        return 1.0 / this.getPiInverse();
    }

    getPiInverse() {
        return Math.pow(this.getTauInverse(), this.kappa / (this.kappa - 1.0));
    }

    getEpsilon() {
        return 1.0 / this.getRoInverse();
    }

    getRoInverse() {
        return Math.pow(this.getTauInverse(), 1.0 / (this.kappa - 1.0));
    }

    getTau() {
        return 1.0 / this.getTauInverse();
    }

    getTauInverse() {
        return 1.0 + (this.kappa - 1.0) / 2.0 * Math.pow(this.mach, 2.0);
    }

}

class GasStateByLambda {
    constructor() {
        this.kappa = 1.4;
        this.lambda = 1.0;
    }

    getArgMin() {
        return 0.0;
    }

    getArgMax() {
        return this.getLambdaMax();
    }

    setArgument(lambda) {
        this.lambda = +lambda;
    }
    
    getArgFieldName() {
        return 'lambda';
    }
    
    getLambda() {
        return this.lambda;
    }

    getLambdaMax() {
        return Math.sqrt((this.kappa + 1.0) / (this.kappa - 1.0));
    }

    getMach() {
        return Math.sqrt(2.0 * Math.pow(this.lambda, 2.0) / (this.kappa + 1.0 - Math.pow(this.lambda, 2.0) * (this.kappa - 1.0)));
    }

    getPi() {
        return Math.pow(this.getEpsilon(), this.kappa);
    }

    getEpsilon() {
        return Math.pow(this.getTau(), 1.0 / (this.kappa - 1.0));
    }

    getTau() {
        return 1.0 - (this.kappa - 1.0) / (this.kappa + 1.0) * Math.pow(this.lambda, 2.0);
    }

    getQu() {
        return this.lambda * this.getEpsilon() * Math.pow((this.kappa + 1.0) / 2.0, 1.0 / (this.kappa - 1.0));
    }
}


class GasStateDelegate {
    constructor(wrappedState) {
        this.wrappedState = wrappedState;
    }
    getMach() {
        return this.wrappedState.getMach();
    }
    getLambda() {
        return this.wrappedState.getLambda();
    }
    getPi() {
        return this.wrappedState.getPi();
    }
    getEpsilon() {
        return this.wrappedState.getEpsilon();
    }
    getTau() {
        return this.wrappedState.getTau();
    }
    getQu() {
        return this.wrappedState.getQu();
    }
    getArgMin() {
        return 0.0;
    }
    getArgMax() {
        return 1.0;
    }
}

class GasStateByQu extends GasStateDelegate {
    constructor() {
        super(new GasStateByLambda());
        this.funQuByLambda = function (lambda) {
            this.setArgument(lambda);
            return this.getQu();
        };
        this.funQuByLambda = this.funQuByLambda.bind(this.wrappedState);
        this.setSubsound();
    }

    setSubsound() {
        this.leftLyambda = 0.0;
        this.rightLyambda = 1.0;
    }

    setSupersound() {
        this.leftLyambda = 1.0;
        this.rightLyambda = this.wrappedState.getLambdaMax();
    }

    setArgument(qu) {
        this.qu = +qu;
        this.wrappedState.setArgument(
            getArgByHalfMethod(this.funQuByLambda, this.qu, this.leftLyambda, this.rightLyambda)
        );
    }
    
    getArgFieldName() {
        return 'qu';
    }
    
    getQu() {
        return this.qu;
    }
}

class GasStateByPi extends GasStateDelegate {
    constructor() {
        //        super(new GasStateByMach());
        super(new GasStateByLambda());
    }

    setArgument(pi) {
        this.pi = +pi;
        this.wrappedState.setArgument(
            //            this._getMach(this.kappa, this.pi)
            this._getLambda(this.kappa, this.pi)
        );
    }
    
    getArgFieldName() {
        return 'pi';
    }
    
    _getMach(k, pi) {
        return Math.sqrt((Math.pow(1.0 / pi, (k - 1.0) / k) - 1.0) * 2.0 / (k - 1.0));
    }

    _getLambda(k, pi) {
        return Math.sqrt((1 - Math.pow(pi, (k - 1.0) / k)) * (k + 1.0) / (k - 1.0));
    }

    getPi() {
        return this.pi;
    }
}

class GasStateByTau extends GasStateDelegate {
    constructor() {
        //        super(new GasStateByMach());
        super(new GasStateByLambda());
    }

    setArgument(tau) {
        this.tau = +tau;
        this.wrappedState.setArgument(
            //            this._getMach(this.kappa, this.tau)
            this._getLambda(this.kappa, this.tau)
        );
    }
    
    getArgFieldName() {
        return 'tau';
    }
    
    _getMach(k, tau) {
        return Math.sqrt((1.0 / tau - 1.0) * 2.0 / (k - 1.0));
    }

    _getLambda(k, tau) {
        return Math.sqrt((1.0 - tau) * (k + 1.0) / (k - 1.0));
    }

    getTau() {
        return this.tau;
    }

}

class GasStateByEpsilon extends GasStateDelegate {
    constructor() {
        //        super(new GasStateByMach());
        super(new GasStateByLambda());
    }

    setArgument(epsilon) {
        this.epsilon = +epsilon;
        this.wrappedState.setArgument(
            this._getLambda(this.kappa, this.epsilon)
        );
    }
    
    getArgFieldName() {
        return 'epsilon';
    }

    _getMach(k, epsilon) {
        return Math.sqrt((Math.pow(1.0 / this.epsilon, k - 1.0) - 1.0) * 2.0 / (k - 1.0));
    }

    _getLambda(k, epsilon) {
        return Math.sqrt((1.0 - Math.pow(epsilon, k - 1.0)) * (k + 1.0) / (k - 1.0));
    }

    getEpsilon() {
        return this.epsilon;
    }
}

class GasStateUpdater {
    constructor(fieldsAndGetters) {
        this.fieldsAndGetters = fieldsAndGetters;
    }

    update(state, methodsOwner) {
        methodsOwner.kappa = +state.get('kappa');
        let argFieldName = methodsOwner.getArgFieldName(); // cache
        let actualArgVal = state.get(argFieldName);
        methodsOwner.setArgument(actualArgVal);
        for (let [fieldName, getterName] of this.fieldsAndGetters.entries()) {
            state.set(fieldName, methodsOwner[getterName]());
        }
        state.set(argFieldName, actualArgVal); // cache
        return state;
    }
}

class Model {
    constructor() {
        this.nameVsGasStateProcessor = new Map([
            ['mach', new GasStateByMach()],
            ['lambda', new GasStateByLambda()],
            ['pi', new GasStateByPi()],
            ['tau', new GasStateByTau()],
            ['epsilon', new GasStateByEpsilon()],
            ['qu', new GasStateByQu()]
        ]);
        this.gasStateUpdater = new GasStateUpdater(new Map([
            ['mach', 'getMach'],
            ['lambda', 'getLambda'],
            ['pi', 'getPi'],
            ['tau', 'getTau'],
            ['epsilon', 'getEpsilon'],
            ['qu', 'getQu']
        ]));
        this.gasState = new Map();
        this.maxKappaVal = 5./3.;  // https://en.wikipedia.org/wiki/Heat_capacity_ratio
        this.__initState();
    }
    
    __initState() {
        this.setKappa(1.4);
        this.setField('mach', 1.0);
    }

    setField(name, value) {
        this.activeStateProcessor = this.nameVsGasStateProcessor.get(name);
        let numVal = +value;
        if (numVal < this.activeStateProcessor.getArgMin()) {
            numVal = this.activeStateProcessor.getArgMin()
        }
        if (numVal > this.activeStateProcessor.getArgMax()) {
            numVal = this.activeStateProcessor.getArgMax()
        }
        this.gasState.set(name, numVal);
    }
    
    setKappa(value) {
        this.gasState.set('kappa', value);
        let kappaVal = +value;
        if (kappaVal < 1.0) {
            this.gasState.set('kappa', '1.0');
        }
        if (kappaVal > this.maxKappaVal) {
            this.gasState.set('kappa', this.maxKappaVal);
        }
    }
    
    setSubsound() {
        this.nameVsGasStateProcessor.get('qu').setSubsound();
        this.setField('qu', this.activeStateProcessor.getQu());
    }
    
    setSupersound() {
        this.nameVsGasStateProcessor.get('qu').setSupersound();
        this.setField('qu', this.activeStateProcessor.getQu());
    }
    
    getActiveState() {
        this.gasStateUpdater.update(this.gasState, this.activeStateProcessor);
        return this.gasState;
    }
}

class SettingsModel {
    constructor() {
        this.settings = new Map();
    }
    
    setField(name, value) {
        this.settings.set(name, value);
    }
    
    formatValueOnOuput(value) {
        let mantissaSize = +this.settings.get('mantissa_size');
        let notation = this.settings.get('notation');
        let formattedValue;
        if (notation == 'scientific') {
            formattedValue = (+value).toExponential(mantissaSize);
        } else {
            formattedValue = (+value).toFixed(mantissaSize);
        }
        formattedValue = this.replaceSeparator(formattedValue);
        formattedValue = formattedValue.replace(this.regexDelTrailZeros, '');
        return formattedValue;
    }
    
    formatValueOnInput(value) {
        return this.replaceSeparator(value);
    }
    
    replaceSeparator(value) {
        let separator = this.settings.get('decimal_separator');
        return value.toString().replace(/[\.\,]/g, separator);
    }
}

let getterByName = {
    'kappa': 'getKappa',
    'mach': 'getMach',
    'lambda': 'getLambda',
    'pi': 'getPi',
    'tau': 'getTau',
    'epsilon': 'getEpsilon',
    'qu': 'getQu'
};


class ControllerFormProperties {
    constructor() {
        let inputs = document.getElementsByClassName("setting_input");
        this.nameVsInput = splitElementsBy('name', inputs);
        this.regexDelTrailZeros = new RegExp('([\.,]?0+)?(e[+-]0+)?$');
        this.initMantissaSizeInput();
    }

    initMantissaSizeInput() {
        let mantissaInput = this.nameVsInput.get('mantissa_size');
        this.mantissaInputController = new ControllerInput(mantissaInput, this, 'change');
        this.mantissaInputController.addLimiterInput(new LimiterInputOfHtmlValue(mantissaInput));
    }

    formatValue(value) {
        let mantissaSize = +this.nameVsInput.get('mantissa_size').value;
        let notation = this.nameVsInput.get('notation').value;
        let formattedValue;
        if (notation == 'scientific') {
            formattedValue = (+value).toExponential(mantissaSize);
        } else {
            //            let intPartSize = Math.trunc(Math.log10(+value)) + 1;
            formattedValue = (+value).toFixed(mantissaSize);
        }
        formattedValue = this.replaceSeparator(formattedValue);
        formattedValue = formattedValue.replace(this.regexDelTrailZeros, '');
        return formattedValue;
    }

    replaceSeparator(value) {
        let separator = this.nameVsInput.get('decimal_separator').value;
        return value.toString().replace(/[\.\,]/g, separator);
    }

    addListenerFormatChanged(listener) {
        for (let input of this.nameVsInput.values()) {
            input.addEventListener('change', listener);
        }
    }
}


class LimiterInputOfHtmlPattern {
    constructor(input) {
        this.pattern = new RegExp(input.pattern);
    }

    limit(prev, curr) {
        if (this.pattern.test(curr)) {
            return curr;
        }
        return prev;
    }
}

class LimiterInputOfHtmlValue {
    constructor(input) {
        this.min = +input.min;
        this.max = +input.max;
    }

    limit(prev, curr) {
        let currVal = +curr;
        if (currVal < this.min) {
            return this.min;
        }
        if (currVal > this.max) {
            return this.max;
        }
        return curr;
    }
}

class LimiterInputOfModelValue {
    constructor(model) {
        this.model = model;
    }

    limit(prev, curr) {
        let currVal = +curr;
        if (currVal < this.model.getArgMin()) {
            return this.model.getArgMin().toString();
        }
        if (currVal > this.model.getArgMax()) {
            return this.model.getArgMax().toString();
        }
        return curr;
    }
}

class LimiterInputOfDecimalSeparator {
    constructor() {}

    limit(prev, curr) {
        return curr.replace(/[\.\,]/g, '\.');
    }
}

class LimiterOutputOfDecimalSeparator {
    constructor(properties) {
        this.properties = properties;
    }

    limit(curr) {
        return this.properties.replaceSeparator(curr);
    }
}

class LimiterOutputOfFloatRepresentation {
    constructor(properties) {
        this.properties = properties;
    }

    limit(curr) {
        return this.properties.formatValue(curr);
    }
}


class LimitedInput {
    constructor(input) {
        this.input = input;
        this.limiters = [
            new LimiterInputOfHtmlPattern(input),
        ];
        if (input.hasAttribute('min') && input.hasAttribute('max')) {
            this.limiters.push(new LimiterInputOfHtmlValue(input));
        }
        let onInput = this.onInput.bind(this);
        input.addEventListener('input', onInput);
    }
    
    updateValue() {
        this.currValue = this.input.value;
        this.prevValue = this.input.value;
    }
    
    onInput() {
        this.currValue = this.input.value;
        for (let limiter of this.limiters) {
            this.currValue = limiter.limit(this.prevValue, this.currValue);
        }
        this.prevValue = this.currValue;
        this.input.value = this.currValue;
    }
}

class ControllerInput {
    //  listener is a method
    constructor(input, properties, inputTypeInputOrChange) {
        this.input = input;
        this.inputType = inputTypeInputOrChange;
        this.name = input.name;
        this.properties = properties;
        this.listenersInput = [];
        this.listenersUpdate = [];
        this.limitersInput = [];
        this.limitersOutOnInput = [];
        this.limitersOutput = [];
        this.currValue = this.input.value;
        this.prevValue = this.input.value;
        this.initEvents();
    }

    initEvents() {
        let signalInput = this.signalInput.bind(this);
        this.input.addEventListener(this.inputType, signalInput);
        let displayCurrVal = this.displayCurrVal.bind(this);
        this.properties.addListenerFormatChanged(displayCurrVal);
    }

    signalInput() {
        this.currValue = this.input.value;
        for (let limiter of this.limitersInput) {
            this.currValue = limiter.limit(this.prevValue, this.currValue);
        }
        for (let listener of this.listenersInput) {
            listener(this.name, this.currValue);
        }
        this.prevValue = this.currValue;
        this.verifyPrevValue();
        console.log(this.prevValue);
        this.displayCurrValWith(this.limitersOutOnInput);
    }

    getValue() {
        return this.currValue;
    }

    getInput() {
        return this.input;
    }

    setValue(value) {
        this.currValue = value;
        this.displayCurrVal();
        this.prevValue = this.input.value;
        this.verifyPrevValue();
        this.signalUpdate();
    }

    verifyPrevValue() {
        for (let limiter of this.limitersInput) {
            this.prevValue = limiter.limit('', this.prevValue);
        }
    }

    displayCurrVal() {
        this.displayCurrValWith(this.limitersOutput);
    }

    displayCurrValWith(limiters) {
        let valForDisplay = this.currValue;
        for (let limiter of limiters) {
            valForDisplay = limiter.limit(valForDisplay);
        }
        this.input.value = valForDisplay;
    }

    signalUpdate() {
        for (let listener of this.listenersUpdate) {
            listener(this.name, this.currValue);
        }
    }

    addListenerInput(listener) {
        this.listenersInput.push(listener);
    }

    addListenerUpdate(listener) {
        this.listenersUpdate.push(listener);
    }

    addLimiterInput(limiter) {
        this.limitersInput.push(limiter);
    }

    addLimiterOutOnInput(limiter) {
        this.limitersOutOnInput.push(limiter);
    }

    addLimiterOutput(limiter) {
        this.limitersOutput.push(limiter);
    }
}

class ControllerGasState {
    constructor(inputController, gasState) {
        this.inputController = inputController;
        this.argGetterName = getterByName[inputController.name];
        this.gasState = gasState;
        this.dependentControllers = [];
        this.initEvents();
    }

    initEvents() {
        let onCurrArgInput = this.onCurrArgInput.bind(this);
        this.inputController.addListenerInput(onCurrArgInput);
    }

    onCurrArgInput(name, value) {
        this.gasState.setArgument(+value);
        this.updateDependentControllers();
    }

    setDependentControllers(allControllers) {
        let thisController = this;
        this.dependentControllers = allControllers.filter(function (item) {
            return item !== thisController;
        });
    }

    updateDependentControllers() {
        for (let dependent of this.dependentControllers) {
            dependent.updateValueBy(this.gasState);
        }
    }

    updateValueBy(currGasState) {
        let newVal = currGasState[this.argGetterName]();
        this.inputController.setValue(newVal);
    }

    bindKappaInputController(kappaInputController) {
        let onKappaChangedSetKappaVal = this.onKappaChangedSetKappaVal.bind(this);
        kappaInputController.addListenerInput(onKappaChangedSetKappaVal);
    }

    onKappaChangedSetKappaVal(name, kappaValue) {
        this.gasState.setKappa(kappaValue);
    }

    addListenerInput(listener) {
        this.inputController.addListenerInput(listener);
    }

    addListenerUpdate(listener) {
        this.inputController.addListenerUpdate(listener);
    }

    setCurrValueToGasState() {
        this.inputController.signalInput();
    }
}

class ControllerActiveState {
    constructor(kappaInputController, nameVsGasStateController, properties) {
        this.kappaInputController = kappaInputController;
        this.nameVsGasStateController = nameVsGasStateController;
        this.properties = properties;
        this.activeName = 'mach';
        this.initListeners();
    }

    initListeners() {
        let onGasFunctionInputSetActive = this.onGasFunctionInputSetActive.bind(this);
        for (let controller of this.nameVsGasStateController.values()) {
            controller.bindKappaInputController(this.kappaInputController);
            controller.addListenerInput(onGasFunctionInputSetActive);
        }
        let onKappaChangedUpdateFields = this.onKappaChangedUpdateFields.bind(this);
        this.kappaInputController.addListenerInput(onKappaChangedUpdateFields);
        let onPropertiesChanged = this.onPropertiesChanged.bind(this);
        this.properties.addListenerFormatChanged(onPropertiesChanged);
    }

    onKappaChangedUpdateFields(name, value) {
        this.activeController().setCurrValueToGasState();
        this.updateActiveDependent();
    }

    onPropertiesChanged() {
        this.updateActiveDependent();
    }

    updateActiveDependent() {
        this.activeController().updateDependentControllers();
    }

    activeController() {
        return this.nameVsGasStateController.get(this.activeName);
    }

    onGasFunctionInputSetActive(name, value) {
        this.activeName = name;
    }

    onMachZoneSwitcherClickedSetQuActive() {
        // set as listener in ControllerMachZoneSwitcher
        this.activeName = 'qu';
    }
}


class ControllerMachZoneSwitcher {
    constructor(machInputController, activeStateController, quController) {
        this.machInputController = machInputController;
        this.activeStateController = activeStateController;
        this.quController = quController;
        let flowSpeedElements = document.getElementsByName('flow_speed');
        this.radios = splitElementsBy('id', flowSpeedElements);
        this.initEvents();
    }

    initEvents() {
        let updateSwitcherState = this.updateSwitcherStateByMachVal.bind(this);
        this.machInputController.addListenerInput(updateSwitcherState);
        this.machInputController.addListenerUpdate(updateSwitcherState);

        let subsoundChecked = this.subsoundChecked.bind(this);
        this.radios.get('subsound').addEventListener('change', subsoundChecked);
        let supersoundChecked = this.supersoundChecked.bind(this);
        this.radios.get('supersound').addEventListener('change', supersoundChecked);

        let onMachZoneSwitcherClickedSetQuActive = this.activeStateController.onMachZoneSwitcherClickedSetQuActive.bind(this.activeStateController);
        let setQuValToGasState = this.setQuValToGasState.bind(this);
        let updateFieldsByQuController = this.updateFieldsByQuController.bind(this);

        for (let radio of this.radios.values()) {
            radio.addEventListener('change', onMachZoneSwitcherClickedSetQuActive);
            radio.addEventListener('change', setQuValToGasState);
            radio.addEventListener('change', updateFieldsByQuController);
        }
    }

    updateSwitcherStateByMachVal(name, value) {
        let val = +value;
        if (val < 1) {
            this.radios.get('subsound').checked = true;
            this.quController.gasState.setSubsound();
            return;
        }
        if (val > 1) {
            this.radios.get('supersound').checked = true;
            this.quController.gasState.setSupersound();
            return;
        }
        // default state
        if (!this.radios.get('subsound').checked && !this.radios.get('supersound').checked) {
            this.radios.get('subsound').checked = true;
            this.quController.gasState.setSubsound();
            return;
        }
    }

    subsoundChecked() {
        this.quController.gasState.setSubsound();
    }

    supersoundChecked() {
        this.quController.gasState.setSupersound();
    }

    setQuValToGasState() {
        this.quController.setCurrValueToGasState();
    }

    updateFieldsByQuController() {
        this.quController.updateDependentControllers();
    }
}


class BasicController {
    constructor(inputs, model) {
        this.model = model;
        this.inputs = inputs;
        this.namesVsInputs = splitElementsBy('name', inputs);
        this.initEvents();
    }
    
    initEvents() {
        let onInput = this.onInput.bind(this);
        for (let input of this.namesVsInputs.values()) {
            input.addEventListener('change', onInput);
        }
    }
    
    setCurrValsToModel() {
        for (let [name, input] of this.namesVsInputs) {
            this.model.setField(name, input.value);
        }
    }
    
    onInput(e) {
        let input = e.target;
        let name = input.name;
        let value = input.value;
        this.model.setField(name, value);
    }
}

class ControllerFormSettings {
    constructor(settingsModel) {
        this.dependentControllers = []
        this.settingsModel = settingsModel;
        this.controllerInputs = document.getElementsByClassName("setting_input");
        this.base = new BasicController(this.controllerInputs, settingsModel);
        this.base.setCurrValsToModel();
        this.initEvents();
    }
    
    addDependentController(dependentController) {
        if (this.dependentControllers.includes(dependentController)) {
            return
        }
        this.dependentControllers.push(dependentController)
    }
    
    initEvents() {
        let onInput = this.onInput.bind(this);
        for (let input of this.controllerInputs) {
            input.addEventListener('change', onInput);
        }
    }
    
    onInput(e) {
        this.update()
    }
    
    update() {
        for (let dependentController of this.dependentControllers) {
            dependentController.update();
        }
    }
}


class ControllerFormGdf2 {
    
    constructor(settingsModel) {
        this.settindsModel = settingsModel;
        this.model = new Model();
        let inputs = document.getElementsByClassName("gdf_input");
        this.namesVsInputs = splitElementsBy('name', inputs);
        this.namesVsLimitedInputs = new Map();
        let flowSpeedElements = document.getElementsByName('flow_speed');
        this.radios = splitElementsBy('id', flowSpeedElements);
        this.currInput = undefined;
        this.initEvents();
        this.update();
        this.__updatePrevValues();
    }
    
    initEvents() {
        let updateSwitcherState = this.updateSwitcherStateByMachVal.bind(this);
        let onFocusIn = this.onFocusIn.bind(this);
        let onFocusOut = this.onFocusOut.bind(this);
        let onInput = this.onInput.bind(this);
        for (let [name, input] of this.namesVsInputs.entries()) {
            this.namesVsLimitedInputs.set(name, new LimitedInput(input));
            input.addEventListener('focusin', onFocusIn);
            input.addEventListener('focusout', onFocusOut);
            input.addEventListener('input', onInput);
        }
        let subsoundChecked = this.subsoundChecked.bind(this);
        this.radios.get('subsound').addEventListener('change', subsoundChecked);
        let supersoundChecked = this.supersoundChecked.bind(this);
        this.radios.get('supersound').addEventListener('change', supersoundChecked);
    }
    
    __updatePrevValues() {
        for (let limitedInput of this.namesVsLimitedInputs.values()) {
            limitedInput.updateValue();
        }
    }
    
    onFocusIn(e) {
        this.currInput = e.target;
        this.namesVsInputs.delete(this.currInput.name);
    }
    
    onFocusOut(e) {
        this.namesVsInputs.set(this.currInput.name, this.currInput);
        this.update();
    }
    
    onInput(e) {
        let input = e.target;
        let name = input.name;
        let value = this.settindsModel.formatValueOnInput(input.value);
        if (name == 'kappa') {
            this.model.setKappa(value);
        } else {
            this.model.setField(name, value);
        }
        this.update();
    }
    
    update() {
        let state = this.model.getActiveState();
        for (let [name, input] of this.namesVsInputs.entries()) {
            input.value = this.settindsModel.formatValueOnOuput(state.get(name));
        }
        this.updateSwitcherStateByMachVal();
    }
    
    updateSwitcherStateByMachVal() {
        let state = this.model.getActiveState();
        let val = +state.get('mach');
        if (val < 1) {
            this.radios.get('subsound').checked = true;
            return;
        }
        if (val > 1) {
            this.radios.get('supersound').checked = true;
            return;
        }
        // default state
        if (!this.radios.get('subsound').checked && !this.radios.get('supersound').checked) {
            this.radios.get('subsound').checked = true;
            this.model.setSubsound();
            return;
        }
    }

    subsoundChecked() {
        this.model.setSubsound();
        this.update();
    }

    supersoundChecked() {
        this.model.setSupersound();
        this.update();
    }
}

class ControllerFormGdf {
    constructor() {
        this.nameVsGasState = new Map([
            ['mach', new GasStateByMach()],
            ['lambda', new GasStateByLambda()],
            ['pi', new GasStateByPi()],
            ['tau', new GasStateByTau()],
            ['epsilon', new GasStateByEpsilon()],
            ['qu', new GasStateByQu()]
        ]);
        this.properties = new ControllerFormProperties();
        this.initInputControllers();
        this.initLimiters();
        this.initGasStateControllers();
        this.initDependencies();
        this.printDefaults();
    }

    initInputControllers() {
        let inputs = document.getElementsByClassName("gdf_input");
        let properties = this.properties;
        let inputControllers = Array.from(inputs, function (input) {
            return new ControllerInput(input, properties, 'input');
        });
        this.nameVsInputController = splitElementsBy('name', inputControllers);
    }

    initLimiters() {
        let limiterInputOfDecimalSeparator = new LimiterInputOfDecimalSeparator();
        let limiterOutputOfDecimalSeparator = new LimiterOutputOfDecimalSeparator(this.properties);
        let limiterOutputOfFloatRepresentation = new LimiterOutputOfFloatRepresentation(this.properties);

        for (let [name, model] of this.nameVsGasState.entries()) {
            let inputController = this.nameVsInputController.get(name);
            let input = inputController.getInput();
            inputController.addLimiterInput(new LimiterInputOfHtmlPattern(input));
            inputController.addLimiterInput(limiterInputOfDecimalSeparator);
            inputController.addLimiterInput(new LimiterInputOfModelValue(model));
            inputController.addLimiterOutOnInput(limiterOutputOfDecimalSeparator);
            inputController.addLimiterOutput(limiterOutputOfFloatRepresentation);
        }

        let kappaInputController = this.nameVsInputController.get('kappa');
        let kappaInput = kappaInputController.getInput();
        kappaInputController.addLimiterInput(new LimiterInputOfHtmlPattern(kappaInput));
        kappaInputController.addLimiterInput(limiterInputOfDecimalSeparator);
        kappaInputController.addLimiterInput(new LimiterInputOfHtmlValue(kappaInput));
        kappaInputController.addLimiterOutOnInput(limiterOutputOfDecimalSeparator);
        kappaInputController.addLimiterOutput(limiterOutputOfDecimalSeparator);
    }

    initGasStateControllers() {
        this.nameVsGasStateController = new Map();
        this.gasStateControllers = [];
        for (let name of this.nameVsGasState.keys()) {
            let gasState = this.nameVsGasState.get(name);
            let inputController = this.nameVsInputController.get(name);
            let gasStateController = new ControllerGasState(inputController, gasState);
            this.nameVsGasStateController.set(name, gasStateController);
            this.gasStateControllers.push(gasStateController);
        }
    }

    initDependencies() {
        this.gasStateControllers.forEach(function (controller, i, controllers) {
            controller.setDependentControllers(controllers);
        });
        this.activeStateController = new ControllerActiveState(
            this.nameVsInputController.get('kappa'), this.nameVsGasStateController, this.properties
        );
        this.machZoneSwitcher = new ControllerMachZoneSwitcher(
            this.nameVsInputController.get('mach'), this.activeStateController, this.nameVsGasStateController.get('qu')
        );
    }

    printDefaults() {
        let defaultActiveName = this.activeStateController.activeName;
        let defaultActiveState = this.nameVsGasState.get(defaultActiveName);
        let defaultActiveController = this.nameVsGasStateController.get(defaultActiveName);
        let kappaInput = this.nameVsInputController.get('kappa');
        kappaInput.setValue(defaultActiveState.getKappa());
        this.activeStateController.updateActiveDependent();
        defaultActiveController.updateValueBy(defaultActiveState);
    }

}

/*
    TODO 200525
        1. tooltips
        2. graphs
*/

//let controller = new ControllerFormGdf();
let settingsModel = new SettingsModel();
let settingsController = new ControllerFormSettings(settingsModel);
let controller = new ControllerFormGdf2(settingsModel);
settingsController.addDependentController(controller);
