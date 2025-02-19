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
        this.load.image('scene-bg', 'images/common/main-bg.png');
        // 加载场景缩略图
        this.load.image('agriculture', 'images/scenes/agriculture/thumbnail.png');
        this.load.image('culture', 'images/scenes/culture/thumbnail.png');
        this.load.image('ecommerce', 'images/scenes/ecommerce/thumbnail.png');
        // 加载返回按钮
        this.load.image('back', 'images/common/back.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景
        this.add.image(width/2, height/2, 'scene-bg')
            .setDisplaySize(width, height);

        // 添加返回按钮
        const backButton = this.add.image(80, 40, 'back')
            .setScale(0.6)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('CharacterSelectScene');
            });

        // 添加选中的角色（左上角）
        const selectedCharacter = this.add.image(150, 80, this.selectedCharacter)
            .setScale(0.2);

        // 添加角色浮动动画
        this.tweens.add({
            targets: selectedCharacter,
            y: '+=10',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 创建场景选择按钮
        const scenes = [
            { key: 'agriculture', sceneName: 'AgricultureScene' },
            { key: 'culture', sceneName: 'CultureScene' },
            { key: 'ecommerce', sceneName: 'EcommerceScene' }
        ];

        // 计算水平布局的参数
        const spacing = 50;
        const cardWidth = 300; // 增加卡片宽度
        const cardHeight = 200; // 设置固定高度
        const totalWidth = (cardWidth * scenes.length) + (spacing * (scenes.length - 1));
        const startX = (width - totalWidth) / 2 + cardWidth / 2;
        const centerY = height / 2;

        scenes.forEach((scene, index) => {
            const x = startX + (cardWidth + spacing) * index;
            
            // 创建场景选择卡片
            const container = this.add.container(x, centerY);
            
            // 创建黑色半透明背景
            const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0.3)
                .setOrigin(0.5);

            // 添加场景缩略图
            const sceneImage = this.add.image(0, 0, scene.key)
                .setDisplaySize(cardWidth - 20, cardHeight - 20);

            container.add([bg, sceneImage]);
            container.setSize(cardWidth, cardHeight);
            container.setInteractive();

            // 添加交互效果
            container.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    y: centerY - 20,
                    duration: 200,
                    ease: 'Back.easeOut'
                });
                bg.setAlpha(0.5);
            });

            container.on('pointerout', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    y: centerY,
                    duration: 200,
                    ease: 'Back.easeOut'
                });
                bg.setAlpha(0.3);
            });

            container.on('pointerdown', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        // 确保 gameState 中有正确的数据结构
                        if (!window.gameState.medals) {
                            window.gameState.medals = {
                                agriculture: false,
                                culture: false,
                                ecommerce: false
                            };
                        }

                        this.scene.start(scene.sceneName, { 
                            character: this.selectedCharacter,
                            medals: window.gameState.medals  // 传递奖牌状态
                        });
                    }
                });
            });
        });
    }
} 