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
            { 
                key: 'male', 
                title: ['AMEER', 'KARACHI']  // 将文字分成数组
            },
            { 
                key: 'female', 
                title: ['SARA', 'LAHORE']    // 将文字分成数组
            }
        ];

        // 设置卡片尺寸和位置
        const cardWidth = width * 0.25;
        const cardHeight = height * 0.6;
        const spacing = width * 0.35;
        const startX = width * 0.35;
        const startY = height * 0.5;

        // 创建角色选择卡片
        characters.forEach((char, index) => {
            const container = this.add.container(startX + spacing * index, startY);

            // 创建卡片效果
            const card = this.add.graphics();
            
            // 增强3D效果的阴影
            card.fillStyle(0x000000, 0.2);
            for(let i = 0; i < 5; i++) {  // 增加阴影层数
                card.fillRoundedRect(
                    -cardWidth/2 + 15 - i, 
                    -cardHeight/2 + 15 - i, 
                    cardWidth + i * 2, 
                    cardHeight + i * 2,
                    20
                );
            }

            // 3D效果 - 右侧边缘
            for(let i = 0; i < 8; i++) {
                card.fillStyle(0xC2B186, 0.3 - i * 0.03);
                card.fillRoundedRect(
                    cardWidth/2 - 8,
                    -cardHeight/2 + i * 2,
                    8,
                    cardHeight,
                    { tl: 0, tr: 20, br: 20, bl: 0 }
                );
            }

            // 3D效果 - 底部边缘
            for(let i = 0; i < 8; i++) {
                card.fillStyle(0xC2B186, 0.3 - i * 0.03);
                card.fillRoundedRect(
                    -cardWidth/2,
                    cardHeight/2 - 8,
                    cardWidth,
                    8,
                    { tl: 0, tr: 0, br: 20, bl: 20 }
                );
            }

            // 主卡片背景（使用渐变和圆角）
            const colors = [0xE6D5AC, 0xD4C398, 0xC2B186];
            
            colors.forEach((color, i) => {
                card.fillStyle(color, 0.2 - i * 0.1);  // 进一步降低透明度
                card.fillRoundedRect(
                    -cardWidth/2,
                    -cardHeight/2,
                    cardWidth,
                    cardHeight,
                    20
                );
            });

            // 添加装饰性边框
            card.lineStyle(2, 0xC2B186, 0.6);  // 边框也增加透明度
            card.strokeRoundedRect(
                -cardWidth/2 + 5,
                -cardHeight/2 + 5,
                cardWidth - 10,
                cardHeight - 10,
                18
            );

            // 增强光泽效果
            const gradientHeight = cardHeight * 0.4;  // 增加光泽区域
            for(let i = 0; i < gradientHeight; i++) {
                const alpha = 0.2 * (1 - i/gradientHeight);  // 渐变透明度
                card.fillStyle(0xFFFFFF, alpha);
                card.fillRoundedRect(
                    -cardWidth/2 + 10,
                    -cardHeight/2 + i,
                    cardWidth - 20,
                    2,
                    { tl: 16, tr: 16, br: 0, bl: 0 }
                );
            }

            // 角色图片
            const character = this.add.sprite(0, -cardHeight * 0.1, char.key)
                .setScale(height * 0.0015);

            // 修改标题文本创建部分
            const titleStyle = {
                fontSize: '28px',
                fontFamily: 'Arial',
                fontWeight: 'bold',
                fill: '#444444',
                padding: { x: 20, y: 5 },  // 减小垂直内边距
                align: 'center'
            };

            // 创建两行文本
            const name = this.add.text(0, cardHeight * 0.3, char.title[0], titleStyle).setOrigin(0.5);
            const city = this.add.text(0, cardHeight * 0.4, char.title[1], {
                ...titleStyle,
                fontSize: '24px'  // 城市名称字体稍小
            }).setOrigin(0.5);

            // 添加到容器时包含两个文本对象
            container.add([card, character, name, city]);
            container.setDepth(1);
            container.setSize(cardWidth, cardHeight);
            container.setInteractive();

            // 悬停效果增强
            container.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    y: startY - 20,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 300,
                    ease: 'Cubic.easeOut'
                });
            });

            container.on('pointerout', () => {
                this.tweens.add({
                    targets: container,
                    y: startY,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 300,
                    ease: 'Cubic.easeOut'
                });
            });

            // 点击效果保持不变
            container.on('pointerdown', () => {
                this.clickSound.play();
                
                this.tweens.add({
                    targets: container,
                    scale: 0.95,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        window.gameState.character = char.key;
                        this.scene.start('SceneSelectScene');
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
