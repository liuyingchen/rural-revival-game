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
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景图
        this.add.image(width/2, height/2, 'main-bg')
            .setDisplaySize(width, height);

        // 创建角色选择区域，调整位置避免重叠
        const leftCard = this.createCharacterCard(width/3 - 50, height/2, 'male');
        const rightCard = this.createCharacterCard(2*width/3 + 50, height/2, 'female');

        // 添加返回按钮（缩小尺寸）
        const backButton = this.add.image(80, 40, 'back')
            .setScale(0.6)  // 缩小到原来的60%
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('PreloadScene');
            });
    }

    createCharacterCard(x, y, characterKey) {
        const cardWidth = 300;
        const cardHeight = 400;
        
        // 创建卡片容器
        const card = this.add.container(x, y);

        // 创建椭圆形阴影效果
        const shadowLayers = 4;  // 减少阴影层数
        const shadows = [];
        const baseOffset = 3;
        const baseAlpha = 0.15;  // 统一的基础透明度

        // 创建主要的椭圆形背景
        const ellipseWidth = cardWidth * 0.9;
        const ellipseHeight = cardHeight * 0.95;

        // 创建统一的阴影层
        for(let i = 0; i < shadowLayers; i++) {
            shadows.push(
                this.add.ellipse(
                    baseOffset * i,
                    baseOffset * i,
                    ellipseWidth - (i * 2),
                    ellipseHeight - (i * 2),
                    0x000000,
                    baseAlpha - (i * 0.02)
                ).setOrigin(0.5)
            );
        }

        // 创建主椭圆背景
        const cardBg = this.add.ellipse(0, 0, ellipseWidth, ellipseHeight, 0x000000, 0.2)
            .setOrigin(0.5);

        // 添加角色图片
        const character = this.add.image(0, 0, characterKey)
            .setDisplaySize(cardWidth-80, cardHeight-80);

        // 组合所有元素
        card.add([...shadows, cardBg, character]);
        
        // 添加简单的浮动动画
        this.tweens.add({
            targets: character,
            y: -5,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 增强交互效果
        cardBg.setInteractive();
        
        cardBg.on('pointerover', () => {
            // 停止浮动动画
            this.tweens.killTweensOf(character);

            // 添加悬停时的动画效果
            this.tweens.add({
                targets: character,
                y: -10,
                duration: 200,
                ease: 'Sine.easeOut'
            });

            shadows.forEach((shadow, index) => {
                shadow.setPosition(
                    baseOffset * (index + 0.5),
                    baseOffset * (index + 0.5)
                );
            });
        });
        
        cardBg.on('pointerout', () => {
            // 恢复浮动动画
            this.tweens.add({
                targets: character,
                y: 0,
                duration: 200,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: character,
                        y: -5,
                        duration: 2000,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            });

            shadows.forEach((shadow, index) => {
                shadow.setPosition(
                    baseOffset * index,
                    baseOffset * index
                );
            });
        });
        
        cardBg.on('pointerdown', () => {
            window.gameState.character = characterKey;
            this.tweens.killTweensOf(character);

            this.children.list.forEach(child => {
                if (child instanceof Phaser.GameObjects.Container && child !== card) {
                    child.list.forEach(element => element.setAlpha(0.3));
                    if (child.list[3] instanceof Phaser.GameObjects.Image) {
                        this.tweens.killTweensOf(child.list[3]);
                    }
                }
            });
            card.list.forEach(element => element.setAlpha(1));
            
            // 添加选中时的动画效果
            this.tweens.add({
                targets: character,
                y: -15,
                duration: 200,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // 动画完成后跳转到场景选择界面
                    this.scene.start('SceneSelectScene', { character: characterKey });
                }
            });
        });

        return card;
    }
}
