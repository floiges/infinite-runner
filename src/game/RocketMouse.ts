// Phaser 3 GameObjects do not have children. This means that you cannot attach an Image to another
// Image or Sprite.
// Unless you are using a Container.

import Phaser from "phaser"
import AnimationKeys from "../consts/AnimationKeys"
import TextureKeys from "../consts/TextureKeys"

enum MouseState {
  Running,
  Killed,
  Dead
}

export default class RocketMouse extends Phaser.GameObjects.Container {
  private flames: Phaser.GameObjects.Sprite
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private mouse: Phaser.GameObjects.Sprite
  private mouseState = MouseState.Running

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)

    // create the Rocket Mouse sprite
    this.mouse = scene.add.sprite(0, 0, TextureKeys.RocketMouse)
      .setOrigin(0.5, 1)


    // create the flames and play the animation
    this.flames = scene.add.sprite(-63, -15, TextureKeys.RocketMouse)

    this.createAnimations()
    this.mouse.play(AnimationKeys.RocketMouseRun)
    this.flames.play(AnimationKeys.RocketFlamesOn)

    this.enableJetpack(false)

    // add this first so it is under the mouse sprite
    this.add(this.flames)
    // add as child of Container
    this.add(this.mouse)

    // add a physics body
    scene.physics.add.existing(this)

    // adjust physics body size and offset
    // use half width and 70% height
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(this.mouse.width * 0.5, this.mouse.height * 0.7)
    // adjust offset to match
    body.setOffset(this.mouse.width * -0.3, -this.mouse.height + 15)

    // get a CusorKeys instance
    this.cursors = scene.input.keyboard.createCursorKeys()
  }

  // A Container does not normally implement a preUpdate() method but it will get called if we create
  // one.
  preUpdate() {
    const body = this.body as Phaser.Physics.Arcade.Body

    switch (this.mouseState) {
      case MouseState.Running: {
        // check is Space bar is down
        if (this.cursors.space?.isDown) {
          // set y acceleration to -600 if so
          body.setAccelerationY(-600)
          this.enableJetpack(true)

          // play the fly animation
          this.mouse.play(AnimationKeys.RocketMouseFly, true)
        } else {
          // turn off acceleration
          body.setAccelerationY(0)
          this.enableJetpack(false)
        }

        // check if touching the ground
        if (body.blocked.down) {
          // play run when touching the ground
          this.mouse.play(AnimationKeys.RocketMouseRun, true)
        } else if (body.velocity.y > 0) {
          // play fall when no longer asending
          this.mouse.play(AnimationKeys.RocketMouseFall, true)
        }
        break
      }
      case MouseState.Killed: {
        // reduce velocity to 99% of current value
        body.velocity.x *= 0.99

        // once less than 5 we can say stop
        if (body.velocity.x <= 5) {
          this.mouseState = MouseState.Dead
        }
        break
      }
      case MouseState.Dead: {
        // make a complete stop
        body.setVelocity(0, 0)
        this.emit('dead')
        break
      }
    }
  }

  enableJetpack(enabled: boolean) {
    this.flames.setVisible(enabled)
  }

  kill() {
    if (this.mouseState !== MouseState.Running) {
      return
    }

    // set state to KILLED
    this.mouseState = MouseState.Killed

    this.mouse.play(AnimationKeys.RocketMouseDead)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAccelerationY(0)
    body.setVelocity(1000, 0)
    this.enableJetpack(false)
  }

  private createAnimations() {
    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseRun, // name of this animation
      // helper to generate frames
      frames: this.mouse.anims.generateFrameNames(TextureKeys.RocketMouse, {
        start: 1,
        end: 4,
        prefix: 'rocketmouse_run',
        zeroPad: 2,
        suffix: '.png'
      }),
      frameRate: 10,
      repeat: -1 // -1 to loop forever
    })

    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseFall,
      frames: [{
        key: TextureKeys.RocketMouse,
        frame: 'rocketmouse_fall01.png'
      }]
    })

    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseFly,
      frames: [{
        key: TextureKeys.RocketMouse,
        frame: 'rocketmouse_fly01.png'
      }]
    })

    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseDead,
      frames: this.mouse.anims.generateFrameNames(TextureKeys.RocketMouse, {
        start: 1,
        end: 2,
        prefix: 'rocketmouse_dead',
        zeroPad: 2,
        suffix: '.png'
      }),
      frameRate: 10
    })

    this.flames.anims.create({
      key: AnimationKeys.RocketFlamesOn,
      frames: this.flames.anims.generateFrameNames(TextureKeys.RocketMouse, {
        start: 1,
        end: 2,
        prefix: 'flame',
        suffix: '.png'
      }),
      frameRate: 10,
      repeat: -1
    })
  }
}