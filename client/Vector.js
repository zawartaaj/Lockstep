"use strict";

/*

    Vector
    
    TODO: convert to use TypedArray to store values? 
    If so, will need to add TypeArray serialization support.

*/

(class Vector extends Serializable {
    initPrototype () {
        this.newSerializableSlot("x", 0)
        this.newSerializableSlot("y", 0) 
    }

    add (aVector) {
        return Vector.clone().setX(this.x() + aVector.x()).setY(this.y() + aVector.y())
    }

    privateWrap (v1, v2) {
        let v = v1 % v2
        if (v < 0) {
            v = v2 - v
        }
        return v
    }

    wrappedWithin (aSize) {
        const nx = this.privateWrap(this.x(), aSize.x())
        const ny = this.privateWrap(this.y(), aSize.y())
        return Vector.clone().setX(nx).setY(ny)
    }

    simHash () {
        return [this.x(), this.y()].simHash()
    }

}.initThisClass());
