export default class SceneSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneSelectScene' });
        // 确保 gameState 存在并包含必要的属性
        if (!window.gameState) {
            window.gameState = {
                medals: {
                    agriculture: false,
                    culture: false,
                    ecommerce: false
                }
            };
        }
    }

    init(data) {
        // 接收传递的角色数据
        this.selectedCharacter = data.character;
    }

    preload() {
        this.load.setBaseURL('assets/');
        // 加载场景选择界面的背景
        this.load.image('scene-select-bg', 'images/common/main-bg.png');
        // 加载场景缩略图
        this.load.image('agriculture', 'images/scenes/agriculture/thumbnail.png');
        this.load.image('culture', 'images/scenes/culture/thumbnail.png');
        this.load.image('ecommerce', 'images/scenes/ecommerce/thumbnail.png');
        // 加载返回按钮
        this.load.image('back', 'images/common/back.png');
        // 加载点击音效
        this.load.audio('click', 'audio/click.mp3');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 添加背景
        this.add.image(width/2, height/2, 'scene-select-bg')
            .setDisplaySize(width, height)
            .setDepth(-1);

        // 创建点击音效
        this.clickSound = this.sound.add('click', { volume: 0.8 });

        // 添加选中的角色
        const characterType = window.gameState.character || 'female';
        this.player = this.add.sprite(
            width * 0.15,
            height * 0.7,
            characterType
        )
        .setScale(height * 0.001)
        .setDepth(2);

        // 场景选择按钮的配置
        const scenes = [
            { key: 'agriculture', title: 'Future Farm Click', scene: 'AgricultureScene' },
            { key: 'culture', title: 'Time Travel Puzzle', scene: 'CultureScene' },
            { key: 'ecommerce', title: 'Mountain Delivery Dash', scene: 'EcommerceScene' }
        ];

        // 修改卡片尺寸和位置配置
        const cardWidth = width * 0.18;     // 稍微窄一点
        const cardHeight = height * 0.45;    // 更高
        const spacing = width * 0.22;        // 增加间距
        const startX = width * 0.35;
        const startY = height * 0.48;        // 稍微往下一点

        // 创建场景选择卡片
        scenes.forEach((scene, index) => {
            const container = this.add.container(startX + spacing * index, startY);

            // 创建卡片效果
            const card = this.add.graphics();

            // 增强3D效果的阴影
            // card.fillStyle(0x000000, 0.2);
            // for(let i = 0; i < 5; i++) {
            //     card.fillRoundedRect(
            //         -cardWidth/2 + 15 - i, 
            //         -cardHeight/2 + 15 - i, 
            //         cardWidth + i * 2, 
            //         cardHeight + i * 2,
            //         20
            //     );
            // }

            // 3D效果 - 右侧边缘
            // for(let i = 0; i < 8; i++) {
            //     card.fillStyle(0xC2B186, 0.3 - i * 0.03);
            //     card.fillRoundedRect(
            //         cardWidth/2 - 8,
            //         -cardHeight/2 + i * 2,
            //         8,
            //         cardHeight,
            //         { tl: 0, tr: 20, br: 20, bl: 0 }
            //     );
            // }

            // // 3D效果 - 底部边缘
            // for(let i = 0; i < 8; i++) {
            //     card.fillStyle(0xC2B186, 0.3 - i * 0.03);
            //     card.fillRoundedRect(
            //         -cardWidth/2,
            //         cardHeight/2 - 8,
            //         cardWidth,
            //         8,
            //         { tl: 0, tr: 0, br: 20, bl: 20 }
            //     );
            // }

            // 主卡片背景（使用渐变和圆角）
            // const colors = [0xE6D5AC, 0xD4C398, 0xC2B186];

            // colors.forEach((color, i) => {
            //     card.fillStyle(color, 0.2 - i * 0.1);
            //     card.fillRoundedRect(
            //         -cardWidth/2,
            //         -cardHeight/2,
            //         cardWidth,
            //         cardHeight,
            //         20
            //     );
            // });

           

            // 增强光泽效果
            const gradientHeight = cardHeight * 0.4;
            for(let i = 0; i < gradientHeight; i++) {
                const alpha = 0.2 * (1 - i/gradientHeight);
                card.fillStyle(0xFFFFFF, alpha);
                card.fillRoundedRect(
                    -cardWidth/2 + 10,
                    -cardHeight/2 + i,
                    cardWidth - 20,
                    2,
                    { tl: 16, tr: 16, br: 0, bl: 0 }
                );
            }

            // 预览图（调整位置和大小）
            const preview = this.add.image(0, -cardHeight * 0.02, scene.key)
                .setDisplaySize(cardWidth * 1, cardHeight * 1.2);

            // 标题（更新样式）
            const title = this.add.text(0, cardHeight * 0.5, scene.title, {
                fontSize: width * 0.013+'px',
                fontWeight: 'bold',
                fill: '#000000',
                backgroundColor: '#ffffff90',
                padding: { x: 2, y: 2 },
                borderRadius: 5
            }).setOrigin(0.5);

            // 增强悬停效果
            container.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    y: startY - 30,          // 更大的上浮距离
                    scaleX: 1.08,            // 更大的放大效果
                    scaleY: 1.08,
                    rotation: 0.02,          // 轻微倾斜
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

            // 点击效果和场景切换
            container.on('pointerdown', () => {
                // 播放点击音效
                this.clickSound.play();
                
                // 点击动画
                this.tweens.add({
                    targets: container,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        this.cameras.main.fade(500, 0, 0, 0, false, (camera, progress) => {
                            if (progress === 1) {
                                this.scene.start(scene.scene);
                            }
                        });
                    }
                });
            });

            // 将所有元素添加到容器
            container.add([card, preview, title]);
            container.setDepth(1);
            container.setSize(cardWidth, cardHeight);
            container.setInteractive();
        });

        // 添加返回按钮
    
        const backButton = this.add.image(width * 0.05, height * 0.1, 'back')
            .setScale(0.5)
            .setDepth(2)
            .setInteractive()
            .on('pointerover', () => {
                this.tweens.add({
                    targets: backButton,
                    scale: 0.6,
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
                                this.scene.start('CharacterSelectScene');
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