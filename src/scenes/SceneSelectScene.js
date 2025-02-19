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
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 添加背景
        this.add.image(width/2, height/2, 'scene-select-bg')
            .setDisplaySize(width, height)
            .setDepth(-1);

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
            { key: 'agriculture', title: '智慧农业', scene: 'AgricultureScene' },
            { key: 'culture', title: '传统文化', scene: 'CultureScene' },
            { key: 'ecommerce', title: '智慧商业', scene: 'EcommerceScene' }
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

            // 创建更强的3D效果
            const card = this.add.graphics();
            
            // 最底层阴影（营造悬浮感）
            card.fillStyle(0x000000, 0.2);
            card.fillRect(-cardWidth/2 + 15, -cardHeight/2 + 15, cardWidth, cardHeight);

            // 侧面（加深的3D效果）
            // 右侧面
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
            // 基础白色背景
            card.fillStyle(0xffffff);
            card.fillRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
            
            // 使用半透明层模拟渐变
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

            // 预览图（调整位置和大小）
            const preview = this.add.image(0, -cardHeight * 0.15, scene.key)
                .setDisplaySize(cardWidth * 0.85, cardHeight * 0.6);

            // 标题（更新样式）
            const title = this.add.text(0, cardHeight * 0.3, scene.title, {
                fontSize: '28px',
                fontWeight: 'bold',
                fill: '#333333',
                backgroundColor: '#ffffff90',
                padding: { x: 20, y: 10 },
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
                // 点击动画
                this.tweens.add({
                    targets: container,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        // 添加过渡动画
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
                // 点击动画
                this.tweens.add({
                    targets: backButton,
                    scale: 0.5,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        // 添加过渡动画
                        this.cameras.main.fade(500, 0, 0, 0, false, (camera, progress) => {
                            if (progress === 1) {
                                this.scene.start('CharacterSelectScene');  // 返回角色选择场景
                            }
                        });
                    }
                });
            });
    }
} 