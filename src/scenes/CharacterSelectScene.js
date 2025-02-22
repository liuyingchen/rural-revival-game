export default class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    preload() {
        // 加载角色选择界面需要的资源
        this.load.setBaseURL('assets/');
        this.load.image('main-bg', 'images/common/main-bg.png');
        // 加载角色图片
        this.load.image('male', 'images/characters/male.png');
        this.load.image('female', 'images/characters/female.png');
        // 加载返回按钮
        this.load.image('back', 'images/common/back.png');
        // 加载点击音效
        this.load.audio('click', 'audio/click.mp3');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 添加背景
        this.add.image(width/2, height/2, 'main-bg')
            .setDisplaySize(width, height);

        // 创建点击音效
        this.clickSound = this.sound.add('click', { volume: 0.8 });

        // 角色配置
        const characters = [
            { key: 'male', title: '男孩' },
            { key: 'female', title: '女孩' }
        ];

        // 设置卡片尺寸和位置
        const cardWidth = width * 0.25;
        const cardHeight = height * 0.6;
        const spacing = width * 0.2;
        const startX = width * 0.4;
        const startY = height * 0.5;

        // 创建角色选择卡片
        characters.forEach((char, index) => {
            const container = this.add.container(startX + spacing * index, startY);

            // 创建3D卡片效果
            const card = this.add.graphics();
            
            // 最底层阴影（营造悬浮感）
            card.fillStyle(0x000000, 0.2);
            card.fillRect(-cardWidth/2 + 15, -cardHeight/2 + 15, cardWidth, cardHeight);

            // 右侧面（3D效果）
            card.fillStyle(0xcccccc);
            card.fillRect(cardWidth/2, -cardHeight/2, 20, cardHeight);
            // 渐变效果
            for(let i = 0; i < 5; i++) {
                card.fillStyle(0xdddddd, 0.8 - i * 0.15);
                card.fillRect(cardWidth/2 + i * 4, -cardHeight/2, 4, cardHeight);
            }

            // 底部面
            card.fillStyle(0xdddddd);
            card.fillRect(-cardWidth/2, cardHeight/2, cardWidth, 20);
            // 渐变效果
            for(let i = 0; i < 5; i++) {
                card.fillStyle(0xeeeeee, 0.8 - i * 0.15);
                card.fillRect(-cardWidth/2, cardHeight/2 + i * 4, cardWidth, 4);
            }

            // 主面（使用多层矩形模拟渐变）
            card.fillStyle(0xffffff);
            card.fillRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
            
            // 渐变效果
            for(let i = 0; i < 10; i++) {
                card.fillStyle(0xf0f0f0, i * 0.03);
                card.fillRect(
                    -cardWidth/2 + (i * cardWidth/10),
                    -cardHeight/2 + (i * cardHeight/10),
                    cardWidth - (i * cardWidth/10),
                    cardHeight - (i * cardHeight/10)
                );
            }
            
            // 卡片边框
            card.lineStyle(2, 0xaaaaaa);
            card.strokeRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);

            // 角色图片
            const character = this.add.sprite(0, -cardHeight * 0.1, char.key)
                .setScale(height * 0.001);

            // 标题
            const title = this.add.text(0, cardHeight * 0.35, char.title, {
                fontSize: '32px',
                fontWeight: 'bold',
                fill: '#333333',
                backgroundColor: '#ffffff90',
                padding: { x: 20, y: 10 },
                borderRadius: 5
            }).setOrigin(0.5);

            // 添加到容器
            container.add([card, character, title]);
            container.setDepth(1);
            container.setSize(cardWidth, cardHeight);
            container.setInteractive();

            // 悬停效果
            container.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    y: startY - 30,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    rotation: 0.02,
                    duration: 300,
                    ease: 'Back.easeOut'
                });
            });

            container.on('pointerout', () => {
                this.tweens.add({
                    targets: container,
                    y: startY,
                    scaleX: 1,
                    scaleY: 1,
                    rotation: 0,
                    duration: 300,
                    ease: 'Back.easeOut'
                });
            });

            // 点击效果
            container.on('pointerdown', () => {
                // 播放点击音效
                this.clickSound.play();
                
                this.tweens.add({
                    targets: container,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        window.gameState.character = char.key;
                        this.cameras.main.fade(500, 0, 0, 0, false, (camera, progress) => {
                            if (progress === 1) {
                                this.scene.start('SceneSelectScene', { character: char.key });
                            }
                        });
                    }
                });
            });
        });

        // 添加返回按钮
        const backButton = this.add.image(80, 40, 'back')
            .setScale(0.6)
            .setDepth(2)
            .setInteractive()
            .on('pointerover', () => {
                this.tweens.add({
                    targets: backButton,
                    scale: 0.7,
                    duration: 200
                });
            })
            .on('pointerout', () => {
                this.tweens.add({
                    targets: backButton,
                    scale: 0.6,
                    duration: 200
                });
            })
            .on('pointerdown', () => {
                // 播放点击音效
                this.clickSound.play();
                
                this.tweens.add({
                    targets: backButton,
                    scale: 0.5,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        this.cameras.main.fade(500, 0, 0, 0, false, (camera, progress) => {
                            if (progress === 1) {
                                window.location.href = './index.html';
                            }
                        });
                    }
                });
            });
    }

    // 场景关闭时清理音效
    shutdown() {
        if (this.clickSound) {
            this.clickSound.destroy();
        }
    }
}
