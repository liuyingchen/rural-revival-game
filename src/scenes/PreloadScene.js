export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // 创建加载进度条
        // const width = this.cameras.main.width;
        // const height = this.cameras.main.height;
        
        // const progressBar = this.add.graphics();
        // const progressBox = this.add.graphics();
        // progressBox.fillStyle(0x222222, 0.8);
        // progressBox.fillRect(width/2 - 160, height/2 - 25, 320, 50);
        
        // const loadingText = this.add.text(width/2, height/2 - 50, '加载中...', {
        //     font: '20px Arial',
        //     fill: '#ffffff'
        // }).setOrigin(0.5, 0.5);
        
        // // 监听加载进度
        // this.load.on('progress', (value) => {
        //     progressBar.clear();
        //     progressBar.fillStyle(0xffffff, 1);
        //     progressBar.fillRect(width/2 - 150, height/2 - 15, 300 * value, 30);
        // });
        
        // // 加载完成时
        // this.load.on('complete', () => {
        //     progressBar.destroy();
        //     progressBox.destroy();
        //     loadingText.destroy();
        // });
        
        // 设置基础路径
        this.load.setBaseURL('assets/');
        
        // 加载背景图和音频
        this.load.image('preload-bg', 'images/common/preload-bg.png');
        this.load.image('start-btn', 'images/common/start.png');  // 加载开始按钮图片
        this.load.audio('bgm', 'audio/bgm.mp3');
        this.load.audio('gamestart', 'audio/gamestart.mp3');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景图
        this.add.image(width/2, height/2, 'preload-bg')
            .setDisplaySize(width, height);

        // 创建背景音乐
        this.bgm = this.sound.add('bgm', { 
            loop: true,
            volume: 0.5
        });

        // 创建一个隐藏的按钮来触发音频
        const hiddenButton = document.createElement('button');
        hiddenButton.style.position = 'absolute';
        hiddenButton.style.top = '0';
        hiddenButton.style.left = '0';
        hiddenButton.style.width = '100%';
        hiddenButton.style.height = '100%';
        hiddenButton.style.opacity = '0';
        hiddenButton.style.cursor = 'default';
        document.body.appendChild(hiddenButton);

        // 确保 AudioContext 已经准备好
        const resumeAudioContext = () => {
            const context = this.sound.context;
            // 恢复 AudioContext
            if (context.state === 'suspended') {
                context.resume();
            }
            // 播放背景音乐
            this.bgm.play();
            // 移除按钮和事件监听
            document.body.removeChild(hiddenButton);
        };

        // 添加真实的点击事件监听
        hiddenButton.addEventListener('click', resumeAudioContext);

        // 模拟点击
        requestAnimationFrame(() => {
            hiddenButton.dispatchEvent(new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            }));
        });

        // 创建按钮容器
        const buttonContainer = this.add.container(width/2, height * 0.8);

        // 添加按钮图片
        const startButton = this.add.image(0, 0, 'start-btn')
            .setScale(0.8)
            .setInteractive();

        // 添加文字
        const startText = this.add.text(0, 0, ' START', {
            fontSize: '36px',
            fontStyle: 'bold',
            fill: '#000000',
        }).setOrigin(0.5);

        // 将图片和文字添加到容器
        buttonContainer.add([startButton, startText]);
        buttonContainer.setDepth(1);

        // 修改悬停效果
        startButton.on('pointerover', () => {
            buttonContainer.setScale(1.05);  // 整体放大
        });

        startButton.on('pointerout', () => {
            buttonContainer.setScale(1);     // 恢复原始大小
        });

        // 点击效果
        startButton.on('pointerdown', () => {
            startButton.disableInteractive();
            
            this.bgm.play();
            
            const gamestart = this.sound.add('gamestart', { volume: 0.8 });
            gamestart.play();
            
            this.tweens.add({
                targets: buttonContainer,
                alpha: 0,
                scale: 0.7,
                duration: 300,
                ease: 'Power2'
            });
            
            gamestart.once('complete', () => {
                this.cameras.main.fadeOut(500);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('CharacterSelectScene');
                });
            });
        });
    }

    // 场景关闭时停止背景音乐
    shutdown() {
        if (this.bgm) {
            this.bgm.stop();
        }
    }
} 