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
        
        // 创建加载界面
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 创建黑色背景
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 0, width, height);
            
        // 添加标题
        this.add.text(width/2, height/3, '乡村振兴', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 创建进度条背景
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        // 创建进度条
        const progressBar = this.add.graphics();

        // 添加加载文本
        const loadingText = this.add.text(width/2, height/2 - 50, '加载中...', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const percentText = this.add.text(width/2, height/2 + 70, '0%', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 创建平滑进度更新
        this.time.addEvent({
            delay: 16, // 约60fps
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

        // 模拟2秒加载过程
        this.time.addEvent({
            delay: 50, // 每50ms更新一次目标进度
            callback: () => {
                this.targetProgress = Math.min(this.targetProgress + 0.025, 1);
            },
            repeat: 40 // 重复40次，总共2秒
        });

        // 加载资源
        this.load.image('loading-bg', 'assets/images/common/loading-bg.png');
        this.load.image('main-bg', 'assets/images/common/main-bg.png');
        this.load.image('male', 'assets/images/characters/male.png');
        this.load.image('female', 'assets/images/characters/female.png');
        this.load.image('button', 'assets/images/ui/button.png');
        this.load.image('medal', 'assets/images/ui/medal.png');
        this.load.image('ecommerce-bg', 'assets/images/scenes/ecommerce/background.png');
        this.load.image('package', 'assets/images/scenes/ecommerce/package.png');
        this.load.image('conveyor', 'assets/images/scenes/ecommerce/conveyor.png');

        // 监听加载完成
        this.load.on('complete', () => {
            loadingText.setText('加载完成！');
            // 确保进度条到达100%后再切换场景
            this.time.delayedCall(500, () => {
                progressBar.destroy();
                progressBox.destroy();
                loadingText.destroy();
                percentText.destroy();
                this.scene.start('CharacterSelectScene');
            });
        });

        // 添加加载错误处理
        this.load.on('loaderror', (file) => {
            console.error('Load error:', file);
            loadingText.setText('加载失败: ' + file.key);
        });
    }

    create() {
        console.log('PreloadScene - create');
    }
}
