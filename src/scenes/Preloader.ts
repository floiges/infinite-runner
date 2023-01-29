import Phaser from "phaser"
import AnimationKeys from "../consts/AnimationKeys"
import SceneKeys from "../consts/SceneKeys"
import TextureKeys from "../consts/TextureKeys"

export default class Preloader extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preloader)
  }

  preload() {
    this.load.image(TextureKeys.Background, 'house/bg_repeat_340x640.png')

    this.load.image(TextureKeys.MouseHole, 'house/object_mousehole.png')

    this.load.image(TextureKeys.Window1, 'house/object_window1.png')
    this.load.image(TextureKeys.Window2, 'house/object_window2.png')

    this.load.image(TextureKeys.Bookcase1, 'house/object_bookcase1.png')
    this.load.image(TextureKeys.Bookcase2, 'house/object_bookcase2.png')

    this.load.image(TextureKeys.LaserEnd, 'house/object_laser_end.png')
    this.load.image(TextureKeys.LaserMiddle, 'house/object_laser.png')

    this.load.image(TextureKeys.Coin, 'house/object_coin.png')

    // load as an atlas
    this.load.atlas(
      TextureKeys.RocketMouse,
      'characters/rocket-mouse.png',
      'characters/rocket-mouse.json'
    )
  }

  // Phaser will only call create() aer all the assets specified in preload() have been loaded.
  create() {
    // Animations are global and created by the AnimationManager. Once created, it can be used by any
    // Sprite in any Scene.

    // start the Game scene
    this.scene.start(SceneKeys.Game)
  }
}