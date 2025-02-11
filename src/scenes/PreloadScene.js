export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
        this.loadingProgress = 0;
        this.targetProgress = 0;
    }

    init() {
        console.log('PreloadScene - init');
    }

    preload() {
        console.log('PreloadScene - preload');
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 0, width, height);
            
        this.add.text(width/2, height/3, '乡村振兴', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        const progressBar = this.add.graphics();

        const loadingText = this.add.text(width/2, height/2 - 50, '加载中...', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const percentText = this.add.text(width/2, height/2 + 70, '0%', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 16,
            callback: () => {
                if (this.loadingProgress < this.targetProgress) {
                    this.loadingProgress = Math.min(this.loadingProgress + 0.01, this.targetProgress);
                    percentText.setText(parseInt(this.loadingProgress * 100) + '%');
                    progressBar.clear();
                    progressBar.fillStyle(0xffffff, 1);
                    progressBar.fillRect(250, 280, 300 * this.loadingProgress, 30);
                }
            },
            loop: true
        });

        this.time.addEvent({
            delay: 50,
            callback: () => {
                this.targetProgress = Math.min(this.targetProgress + 0.025, 1);
            },
            repeat: 40
        });

        this.load.image('loading-bg', 'assets/images/common/loading-bg.png');
        this.load.image('main-bg', 'assets/images/common/main-bg.png');
        this.load.image('male', 'assets/images/characters/male.png');
        this.load.image('female', 'assets/images/characters/female.png');
        this.load.image('button', 'assets/images/ui/button.png');
        this.load.image('medal', 'assets/images/ui/medal.png');
        this.load.image('ecommerce-bg', 'assets/images/scenes/ecommerce/background.png');
        this.load.image('package', 'assets/images/scenes/ecommerce/package.png');
        this.load.image('conveyor', 'assets/images/scenes/ecommerce/conveyor.png');

        this.load.on('complete', () => {
            loadingText.setText('加载完成！');
            this.time.delayedCall(500, () => {
                progressBar.destroy();
                progressBox.destroy();
                loadingText.destroy();
                percentText.destroy();
                this.scene.start('CharacterSelectScene');
            });
        });

        this.load.on('loaderror', (file) => {
            console.error('Load error:', file);
            loadingText.setText('加载失败: ' + file.key);
        });
    }

    create() {
        console.log('PreloadScene - create');
    }
}
