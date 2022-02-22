// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

function asteroids() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.
  const svg = document.getElementById("canvas")!;
  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  let g = new Elem(svg,'g')
    .attr("transform","translate(300.00000 300.00000)")  // modified the translate parameters so that it is 8 s.f.
    .attr("id", "g_")  // element id searchable by document.getElementById()
  
  // create a polygon shape for the space ship as a child of the transform group
  let ship = new Elem(svg, 'polygon', g.elem) 
    .attr("points","-15,20 15,20 0,-20")
    .attr("style","fill:none;stroke:white;stroke-width:1")
  // I changed the ship's design so that it has a white outline and no fill, making it look like the original asteroids game

  // Convert radians to degrees. +90deg at the end because the ship sesat in wrong direction
  const RAD_TO_DEG = (rad:number) => rad * 180 / Math.PI + 90,
  // Convert degrees to radians. -90deg because the RAD_TO_DEG() function uses +90deg
        DEG_TO_RAD = (deg:number) => (deg - 90) * Math.PI / 180,

  // Function that gets the current transform property of the given Elem
  // I did not use g.elem.getboundingClientRect() because that changes the x,y after rotation
  TRANSFORM_MATRIX = (e:Elem) => new WebKitCSSMatrix(window.getComputedStyle(e.elem).webkitTransform),

  // Subscribe mousemove event on the svg canvas
  MOUSE_MOVE = Observable.fromEvent<MouseEvent>(svg, "mousemove")
    // Calculate current pointer position relative to the canvas
    .map(({clientX, clientY}) => ({
      lookx: clientX - svg.getBoundingClientRect().left,
      looky: clientY - svg.getBoundingClientRect().top,
      x: TRANSFORM_MATRIX(g).m41, // m41 is transformX in the Webkit CSS Matrix
      y: TRANSFORM_MATRIX(g).m42  // m42 is transformY in the Webkit CSS Matrix
    }))
    .map(({lookx, looky, x, y}) => 
      // Used alot in games to get rotation in radians: Math.atan2(looky - y, lookx - x)
      // all attribute parameters rounded to 8 s.f. and first 9 characters are taken for easier string manipulation
      // for rotation, all negative values are converted to positive values and rounded to 8 s.f. for easier string manipulation
      g.attr("transform",
        "translate(" + x.toPrecision(8).substring(0, 9) + " " + y.toPrecision(8).substring(0, 9) + ")" +
        "rotate(" + Number(RAD_TO_DEG(Math.atan2(looky - y, lookx - x)) < 0? 360 + RAD_TO_DEG(Math.atan2(looky - y, lookx - x)): RAD_TO_DEG(Math.atan2(looky - y, lookx - x))).toPrecision(8) + ")"))
    .subscribe((g) => console.log(g.attr("transform"))),
  // Z key used to accelerate
  KEY_DOWN_Z = Observable.fromEvent<KeyboardEvent>(document, "keydown")
    .filter(({keyCode}) => keyCode == 90)  // 90 is the key code for Z
    .map(() =>({
      /**
       * A series of conditionals are applied here.
       * This is to wrap the map around for the torus topology.
       * If the position of x or y exceeds 50px off-screen, the ship will spawn on the opposite side.
       * e.g. if x is 651, x will become -49.
       */
      x: TRANSFORM_MATRIX(g).m41 > 650?
        TRANSFORM_MATRIX(g).m41 - 700:
        TRANSFORM_MATRIX(g).m41 < -50?
        TRANSFORM_MATRIX(g).m41 + 700:
        TRANSFORM_MATRIX(g).m41,
      y: TRANSFORM_MATRIX(g).m42 > 650?
        TRANSFORM_MATRIX(g).m42 - 700:
        TRANSFORM_MATRIX(g).m42 < -50?
        TRANSFORM_MATRIX(g).m42 + 700:
        TRANSFORM_MATRIX(g).m42,  // see above for the use of TRANSFORM_MATRIX()
      theta: Number(g.attr("transform").substring(37, 46))  // get rotation - using Greek θ causes errors, so I just name the variable 'theta'
    }))
    .map(({x, y, theta}) =>
      // round values to 8 s.f. and take first 9 characters here
      // use of DEG_TO_RAD() because the trigonometric functions accepts radians
      g.attr("transform",
        "translate(" +
        Number(x + 5 * Math.cos(DEG_TO_RAD(theta))).toPrecision(8).substring(0, 9) + " " +
        Number(y + 5 * Math.sin(DEG_TO_RAD(theta))).toPrecision(8).substring(0, 9) + ")rotate(" +
        theta.toPrecision(8) + ")"))
    .subscribe(() => console.log(g.attr("transform"))), // shows new location of ship on console
  MOUSE_DOWN = Observable.fromEvent<MouseEvent>(svg, "mousedown")  // shoot
    .filter((_) => document.getElementById("g_") !== null)  // do not fire if ship is destroyed
    .flatMap(() => {
      return Observable.interval(300)  // limits firing rate to 0.3 s/shot, but also requires 0.3 s of 'charging up', making the game more challenging
        .takeUntil(Observable.fromEvent<MouseEvent>(svg, "mouseup"))  // stop firing on mouse up
        .filter(() => document.getElementById("canvas") !== null)  // if game over, stop firing
        .map(() => ({
          x: TRANSFORM_MATRIX(g).m41,
          y: TRANSFORM_MATRIX(g).m42,  // see above for the use of TRANSFORM_MATRIX()
          // no wrapping required this time as the bullets do not need to wrap
          theta: Number(g.attr("transform").substring(37, 46))  // get rotation
        }))
        .map(({x, y, theta}) => {
          let bullet = new Elem(svg, "circle")
          .attr("class", "bullet")  // defined a class 'bullet' so that it can be searched by document.getElementsByClassName()
          .attr("cx", x)
          .attr("cy", y)  // spawn bullets at ship's centre
          .attr("r", 2)  // bullet radius, 2 px is chosen so that it is just visible
          .attr("style", "fill: white")  // design of bullets
          .attr("theta", theta);  // angle of rotation of ship, fire bullets in this direction
          Observable.interval(0)
            .takeUntil(Observable.interval(10000))  // move bullets for 10 seconds
            .subscribe(() =>
              // fire bullets, with velocity 10 px/ms in direction theta
              bullet.attr("cx", Number(bullet.attr("cx")) + 10 * Math.cos(DEG_TO_RAD(Number(bullet.attr("theta")))))
                .attr("cy", Number(bullet.attr("cy")) + 10 * Math.sin(DEG_TO_RAD(Number(bullet.attr("theta"))))),
              () => bullet.elem.remove()  // demanifest bullets once the 10 s period is over
            );
        })
    })
    .subscribe(() => {
      console.log("boom");  // log to console
      new Audio("shoot_sfx.mp3").play();  // play gunshot sfx
      // all audio used here are composed by myself using an 8-bit soundfont
    }),
  
  ASTEROIDS_SPAWN = Observable.interval(5000)  // spawn asteroids every 5 seconds
    .map(() => ({
      // find which side of the screen to randomly spawn on
      isXLeft: Math.random() >= 0.5,
      isYUp: Math.random() >= 0.5
    }))
    .map(({isXLeft, isYUp}) => ({
      x: isXLeft? -50 + 15 * Math.random(): 650 - 15 * Math.random(),
      y: isYUp? -50 + 15 * Math.random(): 650 - 15 * Math.random(),  // spawn coordinates
      /**
       * Spawn locations are off screen, and at most 15 px from wrapping point of ship.
       * If isXLeft is true, spawn within 15 px from leftmost wrapping point.
       * Otherwise, spawn within 15 px from rightmost wrapping point.
       * Same concept used for Y-axis.
       * 15 px is chosen so that the asteroid will spawn off-screen.
       */
      v: Math.random(),  // velocity
      theta: 2 * Math.PI * Math.random(),  // direction in radians, so that no need to use DEG_TO_RAD()
      id: String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random()) + String(Math.random())
      /**
       * Give each asteroid a unique ID.
       * This is to ensure that the program know that a certain asteroid has been destroyed.
       * This ID consists of a long string of random numbers generated with Math.random()
       * The string consists of 128 random numbers (each Math.random() generates 16), so having two asteroids with the same id will have low probability (Math.pow(10, -128)).
       */
    }))
    .map(({x, y, v, theta, id}) => {
      let asteroid = new Elem(svg, "circle")
        .attr("id", id)  // random id
        .attr("cx", x)
        .attr("cy", y)  // random spawn point
        .attr("r", 30)  // 30 px radius
        .attr("style", "fill: none; stroke: white; stroke-width: 1");  // white circle with no fill
      Observable.interval(0)
        .subscribe(() => {
          // move asteroid at random velocity and at random direction
          asteroid.attr("cx", Number(asteroid.attr("cx")) + v * Math.cos(theta) > 650? Number(asteroid.attr("cx")) + v * Math.cos(theta) - 700: Number(asteroid.attr("cx")) + v * Math.cos(theta) < 0?  Number(asteroid.attr("cx")) + v * Math.cos(theta) + 700:  Number(asteroid.attr("cx")) + v * Math.cos(theta))
            .attr("cy", Number(asteroid.attr("cy")) + v * Math.sin(theta) > 650? Number(asteroid.attr("cy")) + v * Math.sin(theta) - 700: Number(asteroid.attr("cy")) + v * Math.sin(theta) < 0?  Number(asteroid.attr("cy")) + v * Math.sin(theta) + 700:  Number(asteroid.attr("cy")) + v * Math.sin(theta))
          // detect whether ship crashed
          /* The two lines below detects the location of the ship relative to the asteroid.
           * If less than radius of asteroid, then game over. */
          Math.abs(Number(asteroid.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroid.attr("r"))?
          Math.abs(Number(asteroid.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroid.attr("r"))?
          /**
           * We check whether the ship is destroyed, as sound effect still plays after game over screen pops up.
           * We check whether the asteroid is destroyed, as even when the asteroid is destroyed, the removed svg elements is still able to destroy the player's ship.
           * Play the explosion sfx after ship is destroyed.
           * Remove the svg, then show game over screen.
           */
          document.getElementById("g_") != null && document.getElementById(id) != null? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")):{}:{}:{};
          // bullet collision detection
          /**
           * Get all bullet elements and put it in an array so that the forEach function can be used.
           * Similar concept to the ship collision detection.
           * If both the bullet and the asteroid is not yet destroyed, then destroy both.
           * Play the explosion sfx when destroying, then remove both the bullet and the asteroid.
           * Then, spawn four smaller asteroids.
           */
          Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
            // declare four new asteroids spawned when the parent asteroid breaks
            let asteroidAlpha: Elem, asteroidBeta: Elem, asteroidGamma: Elem, asteroidDelta: Elem;
            Math.abs(Number(asteroid.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroid.attr("r"))?
            Math.abs(Number(asteroid.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroid.attr("r"))?
            a != null && document.getElementById(id) != null? (new Audio("explosion_sfx.mp3").play(), a.remove(),
              asteroid.elem.remove(),
              // create four new asteroids, all functions similar to the parent asteroid code
              // refer to parent asteroid code for explanation
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
              // observe all four asteroids just like the parent asteroid
              // asteroids branch out at π/4, 3π/4, 5π/4 and 7π/4 radians
                .subscribe(() => {
                  asteroidAlpha.attr("cx", Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4) > 650? Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4) - 700: Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4) < 0?  Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4) + 700:  Number(asteroidAlpha.attr("cx")) + v * Math.cos(Math.PI / 4))
                    .attr("cy", Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4) > 650? Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4) - 700: Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4) < 0?  Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4) + 700:  Number(asteroidAlpha.attr("cy")) + v * Math.sin(Math.PI / 4))
                  asteroidBeta.attr("cx", Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4) > 650? Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4) - 700: Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4) < 0?  Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4) + 700:  Number(asteroidBeta.attr("cx")) + v * Math.cos(3 * Math.PI / 4))
                    .attr("cy", Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4) > 650? Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4) - 700: Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4) < 0?  Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4) + 700:  Number(asteroidBeta.attr("cy")) + v * Math.sin(3 * Math.PI / 4))
                  asteroidGamma.attr("cx", Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4) > 650? Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4) - 700: Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4) < 0?  Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4) + 700:  Number(asteroidGamma.attr("cx")) + v * Math.cos(5 * Math.PI / 4))
                    .attr("cy", Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4) > 650? Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4) - 700: Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4) < 0?  Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4) + 700:  Number(asteroidGamma.attr("cy")) + v * Math.sin(5 * Math.PI / 4))
                  asteroidDelta.attr("cx", Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4) > 650? Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4) - 700: Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4) < 0?  Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4) + 700:  Number(asteroidDelta.attr("cx")) + v * Math.cos(7 * Math.PI / 4))
                    .attr("cy", Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4) > 650? Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4) - 700: Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4) < 0?  Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4) + 700:  Number(asteroidDelta.attr("cy")) + v * Math.sin(7 * Math.PI / 4))
                  
                  Math.abs(Number(asteroidAlpha.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroidAlpha.attr("r"))?
                  Math.abs(Number(asteroidAlpha.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroidAlpha.attr("r"))?
                  document.getElementById("g_") != null && document.getElementById(id + "alpha") != null? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")):{}:{}:{};
                  Math.abs(Number(asteroidBeta.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroidBeta.attr("r"))?
                  Math.abs(Number(asteroidBeta.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroidBeta.attr("r"))?
                  document.getElementById("g_") != null && document.getElementById(id + "beta") != null? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")):{}:{}:{};
                  Math.abs(Number(asteroidGamma.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroidGamma.attr("r"))?
                  Math.abs(Number(asteroidGamma.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroidGamma.attr("r"))?
                  document.getElementById("g_") != null && document.getElementById(id + "gamma") != null? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")):{}:{}:{};
                  Math.abs(Number(asteroidDelta.attr("cx")) - Number(g.attr("transform").substring(10, 19))) < Number(asteroidDelta.attr("r"))?
                  Math.abs(Number(asteroidDelta.attr("cy")) - Number(g.attr("transform").substring(20, 29))) < Number(asteroidDelta.attr("r"))?
                  document.getElementById("g_") != null && document.getElementById(id + "delta") != null? (new Audio("explosion_sfx.mp3").play(), svg.remove(), document.write("<h1 style = \"font-family: Arial, Helvetica, sans-serif\">Game Over</h1><h3 style = \"font-family: Arial, Helvetica, sans-serif\">Press F5 to restart</h3>")):{}:{}:{};

                  // instead of creating more asteroids, destroy the smaller asteroids completely
                  Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
                    Math.abs(Number(asteroidAlpha.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroidAlpha.attr("r"))?
                    Math.abs(Number(asteroidAlpha.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroidAlpha.attr("r"))?
                    a != null && document.getElementById(id + "alpha") != null? (new Audio("explosion_sfx.mp3").play(), a.remove(), asteroidAlpha.elem.remove()):{}:{}:{}
                  })
                  Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
                    Math.abs(Number(asteroidBeta.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroidBeta.attr("r"))?
                    Math.abs(Number(asteroidBeta.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroidBeta.attr("r"))?
                    a != null && document.getElementById(id + "beta") != null? (new Audio("explosion_sfx.mp3").play(), a.remove(), asteroidBeta.elem.remove()):{}:{}:{}
                  })
                  Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
                    Math.abs(Number(asteroidGamma.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroidGamma.attr("r"))?
                    Math.abs(Number(asteroidGamma.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroidGamma.attr("r"))?
                    a != null && document.getElementById(id + "gamma") != null? (new Audio("explosion_sfx.mp3").play(), a.remove(), asteroidGamma.elem.remove()):{}:{}:{}
                  })
                  Array.from(svg.getElementsByClassName("bullet")).forEach((a) => {
                    Math.abs(Number(asteroidDelta.attr("cx")) - Number(a.getAttribute("cx"))) < Number(asteroidDelta.attr("r"))?
                    Math.abs(Number(asteroidDelta.attr("cy")) - Number(a.getAttribute("cy"))) < Number(asteroidDelta.attr("r"))?
                    a != null && document.getElementById(id + "delta") != null? (new Audio("explosion_sfx.mp3").play(), a.remove(), asteroidDelta.elem.remove()):{}:{}:{}
                  })
                })):{}:{}:{}
          })
        });
    }).subscribe(() => console.log("asteroid spawned"));
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }
