"use strict";


(class BallTrailView extends Base {
    initPrototype () {
        this.newSlot("balls", null)
    }

    init () {
        super.init()
        this.setBalls([])
        this.setBallCount(1)
    }

    setBallCount (n) {
        let op = 1
        for (let i = 0; i < n; i++) {
            const ball = this.addNewBall()
            ball.setOpacity(op)
            op *= 0.4
        }
    }

    setBackgroundColor (c) {
        this.balls().forEach(ball => ball.setBackgroundColor(c))
        return this
    }

    addNewBall () {
        const ball = BallView.clone()
        this.balls().push(ball)
        return ball
    }

    setParentView (aView) {
        this.balls().forEach(ball => ball.setParentView(aView))
        return this
    }

    removeFromParentView () {
        this.balls().forEach(ball => ball.removeFromParentView())
        return this
    }

    setPosition (p) {
        const balls = this.balls()

        balls.forEach(ball => {
            if (!ball.position()) {
                ball.setPosition(p)
            }
        })

        if (balls.length) {
            for (let i = balls.length-1; i > 0; i--) {
                const b1 = balls[i-1]
                const b2 = balls[i]
                b2.setPosition(b1.position())
            }
            this.balls()[0].setPosition(p)
        }
        return this
    }

    timeStep () {

    }
    

}.initThisClass());

