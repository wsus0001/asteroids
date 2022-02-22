"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    let g = new Elem(svg, 'g')
        .attr("transform", "translate(300.00000 300.00000)")
        .attr("id", "g_");
    let ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 15,20 0,-20")
        .attr("style", "fill:none;stroke:white;stroke-width:1");
    const RAD_TO_DEG = (rad) => rad * 180 / Math.PI + 90, DEG_TO_RAD = (deg) => (deg - 90) * Math.PI / 180, TRANSFORM_MATRIX = (e) => new WebKitCSSMatrix(window.getComputedStyle(e.elem).webkitTransform), MOUSE_MOVE = Observable.fromEvent(svg, "mousemove")
        .map(({ clientX, clientY }) => ({
        lookx: clientX - svg.getBoundingClientRect().left,
        looky: clientY - svg.getBoundingClientRect().top,
        x: TRANSFORM_MATRIX(g).m41,
        y: TRANSFORM_MATRIX(g).m42
    }))
        .map(({ lookx, looky, x, y }) => g.attr("transform", "translate(" + x.toPrecision(8).substring(0, 9) + " " + y.toPrecision(8).substring(0, 9) + ")" +
        "rotate(" + Number(RAD_TO_DEG(Math.atan2(looky - y, lookx - x)) < 0 ? 360 + RAD_TO_DEG(Math.atan2(looky - y, lookx - x)) : RAD_TO_DEG(Math.atan2(looky - y, lookx - x))).toPrecision(8) + ")"))
        .subscribe((g) => console.log(g.attr("transform"))), KEY_DOWN_Z = Observable.fromEvent(document, "keydown")
        .filter(({ keyCode }) => keyCode == 90)
        .map(() => ({
        x: TRANSFORM_MATRIX(g).m41 > 650 ?
            TRANSFORM_MATRIX(g).m41 - 700 :
            TRANSFORM_MATRIX(g).m41 < -50 ?
                TRANSFORM_MATRIX(g).m41 + 700 :
                TRANSFORM_MATRIX(g).m41,
        y: TRANSFORM_MATRIX(g).m42 > 650 ?
            TRANSFORM_MATRIX(g).m42 - 700 :
            TRANSFORM_MATRIX(g).m42 < -50 ?
                TRANSFORM_MATRIX(g).m42 + 700 :
                TRANSFORM_MATRIX(g).m42,
        theta: Number(g.attr("transform").substring(37, 46))
    }))
        .map(({ x, y, theta }) => g.attr("transform", "translate(" +
        Number(x + 5 * Math.cos(DEG_TO_RAD(theta))).toPrecision(8).substring(0, 9) + " " +
        Number(y + 5 * Math.sin(DEG_TO_RAD(theta))).toPrecision(8).substring(0, 9) + ")rotate(" +
        theta.toPrecision(8) + ")"))
        .subscribe(() => console.log(g.attr("transform"))), MOUSE_DOWN = Observable.fromEvent(svg, "mousedown")
        .filter((_) => document.getElementById("g_") !== null)
        .flatMap(() => {
        return Observable.interval(300)
            .takeUntil(Observable.fromEvent(svg, "mouseup"))
            .filter(() => document.getElementById("canvas") !== null)
            .map(() => ({
            x: TRANSFORM_MATRIX(g).m41,
            y: TRANSFORM_MATRIX(g).m42,
            theta: Number(g.attr("transform").substring(37, 46))
        }))
            .map(({ x, y, theta }) => {
            let bullet = new Elem(svg, "circle")
                .attr("class", "bullet")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 2)
                .attr("style", "fill: white")
                .attr("theta", theta);
            Observable.interval(0)
                .takeUntil(Observable.interval(10000))
                .subscribe(() => bullet.attr("cx", Number(bullet.attr("cx")) + 10 * Math.cos(DEG_TO_RAD(Number(bullet.attr("theta")))))
                .attr("cy", Number(bullet.attr("cy")) + 10 * Math.sin(DEG_TO_RAD(Number(bullet.attr("theta"))))), () => bullet.elem.remove());
        });
    })
        .subscribe(() => {
        console.log("boom");
        new Audio("shoot_sfx.mp3").play();
    }), ASTEROIDS_SPAWN = Observable.interval(5000)
        .map(() => ({
        isXLeft: Math.random() >= 0.5,
        isYUp: Math.random() >= 0.5
    }))
        .map(({ isXLeft, isYUp }) => ({
        x: isXLeft ? -50 + 15 * Math.random() : 650 - 15 * Math.random(),
        y: isYUp ? -50 + 15 * Math.random() : 650 - 15 * Math.random(),
        v: Math.random(),
        theta: 2 * Math.PI * Math.random(),
        id: String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random())
    }))
        .map(({ x, y, v, theta, id }) => {
        let asteroid = new Elem(svg, "circle")
            .attr("id", id)
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 30)
            .attr("style", "fill: none; stroke: white; stroke-width: 1");
        Observable.interval(0)
            .subscribe(() => {
            asteroid.attr("cx", Number(asteroid.attr("cx")) + v * Math.cos(theta) > 650 ? Number(asteroid.attr("cx")) + v * Math.cos(theta) - 700 : Number(asteroid.attr("cx")) + v * Math.cos(theta) < 0 ? Number(asteroid.attr("cx")) + v * Math.cos(theta) + 700 : Number(asteroid.attr("cx")) + v * Math.cos(theta))
                .attr("cy", Number(asteroid.attr("cy")) + v * Math.sin(theta) > 650 ? Number(asteroid.attr("cy")) + v * Math.sin(theta) - 700 : Number(asteroid.attr("cy")) + v * Math.sin(theta) < 0 ? Number(asteroid.attr("cy")) + v * Math.sin(theta) + 700 : Number(asteroid.attr("cy")) + v * Math.sin(theta));
            Math.abs(Number(asteroid.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroid.attr("r")) ?
                Math.abs(Number(asteroid.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroid.attr("r")) ?
                    document.getElementById("g_") != null && document.getElementById(id) != null ? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")) : {} : {} : {};
            Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
                let asteroidAlpha, asteroidBeta, asteroidGamma, asteroidDelta;
                Math.abs(Number(asteroid.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroid.attr("r")) ?
                    Math.abs(Number(asteroid.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroid.attr("r")) ?
                        a != null && document.getElementById(id) != null ? (new Audio("explosion_sfx.mp3").play(), a.remove(),
                            asteroid.elem.remove(),
                            asteroidAlpha = new Elem(svg, "circle")
                                .attr("id", id + "alpha")
                                .attr("cx", asteroid.attr("cx"))
                                .attr("cy", asteroid.attr("cy"))
                                .attr("r", 15)
                                .attr("style", "fill: none; stroke: white; stroke-width: 1"),
                            asteroidBeta = new Elem(svg, "circle")
                                .attr("id", id + "beta")
                                .attr("cx", asteroid.attr("cx"))
                                .attr("cy", asteroid.attr("cy"))
                                .attr("r", 15)
                                .attr("style", "fill: none; stroke: white; stroke-width: 1"),
                            asteroidGamma = new Elem(svg, "circle")
                                .attr("id", id + "gamma")
                                .attr("cx", asteroid.attr("cx"))
                                .attr("cy", asteroid.attr("cy"))
                                .attr("r", 15)
                                .attr("style", "fill: none; stroke: white; stroke-width: 1"),
                            asteroidDelta = new Elem(svg, "circle")
                                .attr("id", id + "delta")
                                .attr("cx", asteroid.attr("cx"))
                                .attr("cy", asteroid.attr("cy"))
                                .attr("r", 15)
                                .attr("style", "fill: none; stroke: white; stroke-width: 1"),
                            Observable.interval(0)
                                .subscribe(() => {
                                asteroidAlpha.attr("cx", Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4) > 650 ? Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4) - 700 : Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4) < 0 ? Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4) + 700 : Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4))
                                    .attr("cy", Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4) > 650 ? Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4) - 700 : Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4) < 0 ? Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4) + 700 : Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4));
                                asteroidBeta.attr("cx", Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4) > 650 ? Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4) - 700 : Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4) < 0 ? Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4) + 700 : Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4))
                                    .attr("cy", Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4) > 650 ? Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4) - 700 : Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4) < 0 ? Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4) + 700 : Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4));
                                asteroidGamma.attr("cx", Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4) > 650 ? Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4) - 700 : Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4) < 0 ? Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4) + 700 : Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4))
                                    .attr("cy", Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4) > 650 ? Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4) - 700 : Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4) < 0 ? Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4) + 700 : Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4));
                                asteroidDelta.attr("cx", Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4) > 650 ? Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4) - 700 : Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4) < 0 ? Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4) + 700 : Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4))
                                    .attr("cy", Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4) > 650 ? Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4) - 700 : Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4) < 0 ? Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4) + 700 : Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4));
                                Math.abs(Number(asteroidAlpha.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroidAlpha.attr("r")) ?
                                    Math.abs(Number(asteroidAlpha.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroidAlpha.attr("r")) ?
                                        document.getElementById("g_") != null && document.getElementById(id + "alpha") != null ? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")) : {} : {} : {};
                                Math.abs(Number(asteroidBeta.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroidBeta.attr("r")) ?
                                    Math.abs(Number(asteroidBeta.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroidBeta.attr("r")) ?
                                        document.getElementById("g_") != null && document.getElementById(id + "beta") != null ? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")) : {} : {} : {};
                                Math.abs(Number(asteroidGamma.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroidGamma.attr("r")) ?
                                    Math.abs(Number(asteroidGamma.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroidGamma.attr("r")) ?
                                        document.getElementById("g_") != null && document.getElementById(id + "gamma") != null ? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")) : {} : {} : {};
                                Math.abs(Number(asteroidDelta.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroidDelta.attr("r")) ?
                                    Math.abs(Number(asteroidDelta.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroidDelta.attr("r")) ?
                                        document.getElementById("g_") != null && document.getElementById(id + "delta") != null ? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")) : {} : {} : {};
                                Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
                                    Math.abs(Number(asteroidAlpha.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroidAlpha.attr("r")) ?
                                        Math.abs(Number(asteroidAlpha.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroidAlpha.attr("r")) ?
                                            a != null && document.getElementById(id + "alpha") != null ? (new Audio("explosion_sfx.mp3").play(), a.remove(), asteroidAlpha.elem.remove()) : {} : {} : {};
                                });
                                Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
                                    Math.abs(Number(asteroidBeta.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroidBeta.attr("r")) ?
                                        Math.abs(Number(asteroidBeta.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroidBeta.attr("r")) ?
                                            a != null && document.getElementById(id + "beta") != null ? (new Audio("explosion_sfx.mp3").play(), a.remove(), asteroidBeta.elem.remove()) : {} : {} : {};
                                });
                                Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
                                    Math.abs(Number(asteroidGamma.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroidGamma.attr("r")) ?
                                        Math.abs(Number(asteroidGamma.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroidGamma.attr("r")) ?
                                            a != null && document.getElementById(id + "gamma") != null ? (new Audio("explosion_sfx.mp3").play(), a.remove(), asteroidGamma.elem.remove()) : {} : {} : {};
                                });
                                Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
                                    Math.abs(Number(asteroidDelta.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroidDelta.attr("r")) ?
                                        Math.abs(Number(asteroidDelta.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroidDelta.attr("r")) ?
                                            a != null && document.getElementById(id + "delta") != null ? (new Audio("explosion_sfx.mp3").play(), a.remove(), asteroidDelta.elem.remove()) : {} : {} : {};
                                });
                            })) : {} : {} : {};
            });
        });
    }).subscribe(() => console.log("asteroid spawned"));
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map