export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // 设置基础路径
        this.load.setBaseURL('assets/');
        
        // 加载背景图和音频
        this.load.image('preload-bg', 'images/common/preload-bg.png');
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

        // 添加开始游戏按钮
        const startButton = this.add.text(width/2, height * 0.8, '点击开始游戏', {
            fontSize: '48px',
            fontStyle: 'bold',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 30, y: 15 },
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 2,
                stroke: true,
                fill: true
            }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);

        // 添加按钮交互效果
        startButton.on('pointerover', () => {
            startButton.setScale(1.1);
            startButton.setStyle({ backgroundColor: '#333333' });
        });

        startButton.on('pointerout', () => {
            startButton.setScale(1);
            startButton.setStyle({ backgroundColor: '#000000' });
        });

        startButton.on('pointerdown', () => {
            // 禁用按钮防止重复点击
            startButton.disableInteractive();
            
            // 停止背景音乐
            this.bgm.stop();
            
            // 播放开始游戏音效
            const gamestart = this.sound.add('gamestart', { volume: 0.8 });
            gamestart.play();
            
            // 添加过渡动画
            this.tweens.add({
                targets: startButton,
                alpha: 0,
                scale: 0.8,
                duration: 300,
                ease: 'Power2'
            });
            
            // 等待音效播放完毕后切换场景
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