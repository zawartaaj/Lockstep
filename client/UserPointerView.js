"use strict";

/*

    UserPointerView


*/

(class UserPointerView extends View {
    initPrototype () {
        this.newSlot("name", "?")
    }

    init () {
        super.init()

    }

    setName (s) {
        this._name = s
        const r = Math.floor(this._name.simHash() % 255)
        const g = Math.floor(this._name.simHash().simHash() % 255)
        const b = Math.floor(this._name.simHash().simHash().simHash() % 255)
        this.setColor("rgb(" + r + "," + g + "," + b + ")")
        this.setupInnerHtml()
        return this
    }

    willDestory () {
        this.removeFromParent()
    }

    /*
    setPosition (p) {
        super.setPosition(p)
        //console.log(this.type() + "setPosition " + p.x() + ", " + p.y())
        return this
    }
    */

    setupInnerHtml () {
       // this.element().innerHTML = "<object type='image/svg+xml' data='client/resources/cursor-filled.svg'></object>" + this.name()
        const svg = '<svg fill="var(--fillColor)" stroke="var(--fillColor)" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 48 48" width="24px" height="24px"><path d="M35.654,24.09L13.524,3.404c-0.437-0.407-1.074-0.517-1.622-0.28C11.354,3.362,11,3.902,11,4.5v30	c0,0.577,0.331,1.103,0.851,1.352c0.519,0.251,1.137,0.18,1.587-0.181l6.112-4.892l5.777,13.306c0.33,0.76,1.214,1.109,1.973,0.778	l4.586-1.992c0.76-0.33,1.108-1.213,0.778-1.973l-3.044-7.011l-2.733-6.294l7.914-0.915c0.581-0.067,1.07-0.466,1.253-1.021	C36.237,25.1,36.081,24.49,35.654,24.09z"/></svg>'
        this.element().innerHTML = svg + this.name()
    }

    setColor (c) {
        super.setColor(c)   
        const s = this.element().style
        s.setProperty("--fillColor", c)
        return this
    }

    setupStyle () {
        super.setupStyle()
        const s = this.element().style
        //s.border = "1px solid red"
        s.backgroundColor = "transparent"
        s.overflow = "visible";
        s.fontFamily = "monospace";
        s.fontSize = "1em";
        s.color = "white";
        s.userSelect = "none";
        s.cursor = "none";
        //s.transform = "scale(0.5)";
    }

}.initThisClass());