export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    init() {
        console.log('PreloadScene - init');
    }

    preload() {
        console.log('PreloadScene - preload - 开始加载资源');
        
        // 检查资源加载是否成功
        this.load.on('complete', () => {
            console.log('资源加载完成');
        });

        this.load.on('loaderror', (file) => {
            console.error('资源加载失败:', file.src);
        });

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 预先加载所有需要的资源
        this.load.image('preload-bg', 'assets/images/common/preload-bg.png');
        this.load.image('button', 'assets/images/ui/button.png');
        this.load.image('loading-bg', 'assets/images/common/loading-bg.png');
        this.load.image('main-bg', 'assets/images/common/main-bg.png');
        this.load.image('male', 'assets/images/characters/male.png');
        this.load.image('female', 'assets/images/characters/female.png');
        this.load.image('medal', 'assets/images/ui/medal.png');
        this.load.image('ecommerce-bg', 'assets/images/scenes/ecommerce/background.png');
        this.load.image('package', 'assets/images/scenes/ecommerce/package.png');

        // 加载两种状态的包裹图片
        this.load.image('package-open', 'assets/images/scenes/ecommerce/package-open.png');
        this.load.image('package-closed', 'assets/images/scenes/ecommerce/package-closed.png');
        this.load.image('conveyor', 'assets/images/scenes/ecommerce/conveyor.png');

        // 加载角色精灵图
        this.load.spritesheet('male-walk', 'assets/images/characters/male-walk.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        this.load.spritesheet('female-walk', 'assets/images/characters/female-walk.png', {
            frameWidth: 128,
            frameHeight: 128
        });

        // 加载特效
        this.load.image('sparkle', 'assets/images/effects/sparkle.png');
    }

    create() {
        console.log('PreloadScene - create - 开始创建场景');
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        try {
            // 显示背景图
            const bg = this.add.image(width/2, height/2, 'preload-bg');
            console.log('背景图加载成功');

            // 创建开始按钮
            const startButton = this.add.container(width/2, height * 0.8);
            const buttonBg = this.add.image(0, 0, 'button')
                .setDisplaySize(300, 80);
            const buttonText = this.add.text(0, 0, 'START', {
                fontSize: '48px',
                fontWeight: 'bold',
                fill: '#ffffff'
            }).setOrigin(0.5);

            startButton.add([buttonBg, buttonText]);
            startButton.setSize(300, 80);
            startButton.setInteractive();

            // 添加按钮悬停效果
            startButton.on('pointerover', () => {
                buttonBg.setScale(1.1);
                buttonText.setScale(1.1);
            });

            startButton.on('pointerout', () => {
                buttonBg.setScale(1);
                buttonText.setScale(1);
            });

            startButton.on('pointerdown', () => {
                console.log('开始按钮被点击');
                this.scene.start('CharacterSelectScene');
            });

            console.log('场景创建完成');
        } catch (error) {
            console.error('场景创建错误:', error);
        }
    }
}
