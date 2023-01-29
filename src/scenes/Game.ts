import Phaser from "phaser"
import SceneKeys from "../consts/SceneKeys"
import TextureKeys from "../consts/TextureKeys"
import LaserObstacle from "../game/LaserObstacle"
import RocketMouse from "../game/RocketMouse"
import eventCenter from "../utils/eventCenter"

export default class Game extends Phaser.Scene {
  // create the background class property
  private background!: Phaser.GameObjects.TileSprite

  private mouseHole!: Phaser.GameObjects.Image

  private window1!: Phaser.GameObjects.Image
  private window2!: Phaser.GameObjects.Image

  private bookcase1!: Phaser.GameObjects.Image
  private bookcase2!: Phaser.GameObjects.Image

  private bookcases: Phaser.GameObjects.Image[] = []
  private windows: Phaser.GameObjects.Image[] = []

  private laserObstacle!: LaserObstacle
  private mouse!: RocketMouse

  // A Group has built-in support for recycling GameObjects and we’ll want to do that instead of creating
  // new coins as we need them and destroying coins as they scroll o the screen.
  private coins!: Phaser.Physics.Arcade.StaticGroup

  private scroreLabel!: Phaser.GameObjects.Text
  private score = 0

  constructor() {
    super(SceneKeys.Game)
  }

  // called by Phaser when the Scene is started. It is
  // called before preload() and create().
  init() {
    this.score = 0
  }

  create() {
    // Phaser has a built-in TileSprite that will conveniently repeat the same image over a given width.

    // store the width and height of the game screen
    const width = this.scale.width
    const height = this.scale.height

    // change this.add.image to this.add.tileSprite
    this.background = this.add.tileSprite(0, 0, width, height, TextureKeys.Background)
      .setOrigin(0)
      .setScrollFactor(0, 0) // keep from scrolling


    this.mouseHole = this.add.image(
      Phaser.Math.Between(900, 1500), // x value
      501,
      TextureKeys.MouseHole
    )

    this.window1 = this.add.image(
      Phaser.Math.Between(900, 1300),
      200,
      TextureKeys.Window1
    )

    this.window2 = this.add.image(
      Phaser.Math.Between(1600, 2000),
      200,
      TextureKeys.Window2
    )

    this.windows = [this.window1, this.window2]

    this.bookcase1 = this.add.image(
      Phaser.Math.Between(2200, 2700),
      580,
      TextureKeys.Bookcase1
    )
    .setOrigin(0.5, 1)

    this.bookcase2 = this.add.image(
      Phaser.Math.Between(2900, 3400),
      580,
      TextureKeys.Bookcase2
    )
    .setOrigin(0.5, 1)

    this.bookcases = [this.bookcase1, this.bookcase2]

    this.laserObstacle = new LaserObstacle(this, 900, 100)
    this.add.existing(this.laserObstacle)

    this.coins = this.physics.add.staticGroup()
    this.spawnCoins()

    this.scroreLabel = this.add.text(10, 10, `Score: ${this.score}`, {
      fontSize: '24px',
      color: '#080808',
      backgroundColor: '#F8E71C',
      shadow: { fill: true, blur: 0, offsetY: 0 },
      padding: { left: 15, right: 15, top: 10, bottom: 10 }
    }).setScrollFactor(0)

    // // change this.add.sprite to this.physics.add.sprite
    // // and store the sprite in a mouse variable
    // const mouse = this.physics.add.sprite(
    //   width * 0.5, // middle of screen
    //   height - 30, // set y to top of floor
    //   TextureKeys.RocketMouse, // atlas key given in preload
    //   'rocketmouse_fly01.png'
    // )
    // .setOrigin(0.5, 1) // set origin to feet
    // .play(AnimationKeys.RocketMouseRun)
    this.mouse = new RocketMouse(this, width * 0.5, height - 30)
    this.mouse.once('dead', () => {
      this.scene.run(SceneKeys.GameOver)
    })
    this.add.existing(this.mouse)

    const body = this.mouse.body as Phaser.Physics.Arcade.Body
    body.setCollideWorldBounds(true)

    body.setVelocityX(200)

    this.physics.world.setBounds(
      0, 0, // x, y
      Number.MAX_SAFE_INTEGER, height - 55 // width, height
    )

    //  tells the camera to follow Rocket Mouse as he moves around the world.
    this.cameras.main.startFollow(this.mouse)
    // sets the bounds for the camera so that it doesn’t move past the top or bottom of the screen.
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, height)

    this.physics.add.overlap(
      this.laserObstacle,
      this.mouse,
      this.handleOverlapLaser,
      undefined,
      this
    )

    this.physics.add.overlap(
      this.coins,
      this.mouse,
      this.handleCollectCoin,
      undefined,
      this
    )

    eventCenter.on('restart', () => {
      // stop the GameOver scene
      this.scene.stop(SceneKeys.GameOver)

      // stop and restart the Game scene
      this.scene.restart()
    })
  }

  update(t: number, dt: number) {
    this.wrapMouseHole()

    this.wrapWindows()

    this.wrapBookcases()

    this.wrapLaserObstacle()

    // scroll the background
    this.background.setTilePosition(this.cameras.main.scrollX)

    this.teleportBackwards()
  }

  private spawnCoins() {
    // make sure all coins area inactive and hidden
    this.coins.children.each(child => {
      const coin = child as Phaser.Physics.Arcade.Sprite
      this.coins.killAndHide(coin)
      coin.body.enable = false
    })

    const scrollX = this.cameras.main.scrollX
    const rightEdge = scrollX + this.scale.width

    // start at 100 pixels past the right side of the screen
    let x = rightEdge + 100

    // random number from 1 - 20
    const numCoins = Phaser.Math.Between(1, 20)

    // the coins based on random number
    for (let i = 0; i < numCoins; ++i) {
      const coin = this.coins.get(
        x,
        Phaser.Math.Between(100, this.scale.height - 100),
        TextureKeys.Coin
      ) as Phaser.Physics.Arcade.Sprite

      // make sure coin is active and visible
      coin.setVisible(true)
      coin.setActive(true)

      // enable and adjust physics body to be a circle
      const body = coin.body as Phaser.Physics.Arcade.StaticBody
      body.setCircle(body.width * 0.5)
      body.enable = true

      // update the body x, y position from the GameObject
      body.updateFromGameObject()

      // move x a random amount
      x += coin.width * 1.5
    }
  }

  private handleOverlapLaser(
    obj1: Phaser.GameObjects.GameObject,
    obj2: Phaser.GameObjects.GameObject) {
    this.mouse.kill()
  }

  private handleCollectCoin(
    obj1: Phaser.GameObjects.GameObject,
    obj2: Phaser.GameObjects.GameObject) {
    // obj2 wiil be the coin
    const coin = obj2 as Phaser.Physics.Arcade.Sprite

    // use the group to hide it
    this.coins.killAndHide(coin)

    // and turn off the physics body
    // The coin’s physics body is also disabled so that it doesn’t register more overlaps.
    coin.body.enable = false

    this.score += 1
    this.scroreLabel.text = `Score: ${this.score}`
  }

  // determine when the mouseHole scrolls o the le side of the screen
  // and give it a new position ahead of Rocket Mouse.
  private wrapMouseHole() {
    const scrollX = this.cameras.main.scrollX
    const rightEdge = scrollX + this.scale.width

    if (this.mouseHole.x + this.mouseHole.width < scrollX) {
      this.mouseHole.x = Phaser.Math.Between(
        rightEdge + 100,
        rightEdge + 1000
      )
    }
  }

  private wrapWindows() {
    const scrollX = this.cameras.main.scrollX
    const rightEdge = scrollX + this.scale.width

    // multiply by 2 to add some more padding
    let width = this.window1.width * 2
    if (this.window1.x + width < scrollX) {
      this.window1.x = Phaser.Math.Between(
        rightEdge + width,
        rightEdge + width + 800
      )

      // use find() to look for a bookcase that overlaps
      // with the new window position
      const overlap = this.bookcases.find(bc => {
        return Math.abs(this.window1.x - bc.x) <= this.window1.width
      })

      // then set visible to true if there is no overlap
      this.window1.visible = !overlap
    }

    width = this.window2.width
    if (this.window2.x + width < scrollX) {
      this.window2.x = Phaser.Math.Between(
        this.window1.x + width,
        this.window1.width + width + 800
      )

      // use find() to look for a bookcase that overlaps
      // with the new window position
      const overlap = this.bookcases.find(bc => {
        return Math.abs(this.window2.x - bc.x) <= this.window2.width
      })

      // then set visible to true if there is no overlap
      this.window2.visible = !overlap
    }
  }

  private wrapBookcases() {
    const scrollX = this.cameras.main.scrollX
    const rightEdge = scrollX + this.scale.width

    let width = this.bookcase1.width * 2
    if (this.bookcase1.x + width < scrollX) {
      this.bookcase1.x = Phaser.Math.Between(
        rightEdge + width,
        rightEdge + width + 800
      )

      // use find() to look for a window that overlaps
      // with the new bookcase position
      // We still use the window’s width because it is larger than the bookcase’s width.
      const overlap = this.windows.find(win => {
        return Math.abs(this.bookcase1.x - win.x) <= win.width
      })

      // then set visible to true if there is no overlap
      this.bookcase1.visible = !overlap
    }

    width = this.bookcase2.width
    if (this.bookcase2.x + width < scrollX) {
      this.bookcase2.x = Phaser.Math.Between(
        this.bookcase1.x + width,
        this.bookcase1.x + width + 800
      )

      // use find() to look for a window that overlaps
      // with the new bookcase position
      const overlap = this.windows.find(win => {
        return Math.abs(this.bookcase2.x - win.x) <= win.width
      })

      // then set visible to true if there is no overlap
      this.bookcase2.visible = !overlap
    }
  }

  private wrapLaserObstacle() {
    const scrollX = this.cameras.main.scrollX
    const rightEdge = scrollX + this.scale.width

    // body variable with specific physics body type
    const body = this.laserObstacle.body as Phaser.Physics.Arcade.StaticBody

    const width = body.width
    if (this.laserObstacle.x + width < scrollX) {
      this.laserObstacle.x = Phaser.Math.Between(
        rightEdge + width,
        rightEdge + width + 1000
      )
      this.laserObstacle.y = Phaser.Math.Between(0, 300)

      // set the physics body's position
      // add body.offset.x to account for x offset
      body.position.x = this.laserObstacle.x + body.offset.x
      body.position.y = this.laserObstacle.y
    }
  }

  // 模拟无限滚动
  private teleportBackwards() {
    const scrollX = this.cameras.main.scrollX
    // teleport backward when scrolled
    // beyond a multiple of the background texture width.
    // The background image has a width of 340 pixels so can we multiply that by 7 and use 2380 instead of 2500.
    const maxX = 2380

    // perform a teleport once scrolled beyond 2500
    if (scrollX > maxX) {
      // teleport the mouse and mousehole
      this.mouse.x -= maxX
      this.mouseHole.x -= maxX

      // teleport each window
      this.bookcases.forEach(bc => {
        bc.x -= maxX
      })

      // teleport the laser
      this.laserObstacle.x -= maxX
      const laserBody = this.laserObstacle.body as Phaser.Physics.Arcade.StaticBody

      // as well as the laser physics body
      laserBody.x -= maxX

      // call spwanCoins
      this.spawnCoins()

      // teleport any spawned coins
      this.coins.children.each(child => {
        const coin = child as Phaser.Physics.Arcade.Sprite
        if (!coin.active) {
          return
        }

        coin.x -= maxX
        const body = coin.body as Phaser.Physics.Arcade.StaticBody
        body.updateFromGameObject()
      })
    }
  }
}