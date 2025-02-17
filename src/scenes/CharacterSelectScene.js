export default class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, 'main-bg')
            .setDisplaySize(width, height);

        this.add.text(width/2, 100, '选择你的角色', {
            fontSize: '36px',
            fill: '#000000',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.createCharacterDisplay('male', width/3, height/2);
        this.createCharacterDisplay('female', width*2/3, height/2);

        this.createBackButton();
    }

    createCharacterDisplay(type, x, y) {
        const container = this.add.container(x, y);
        
        // 增大容器尺寸
        const containerWidth = 200;  // 增加宽度
        const containerHeight = 300; // 增加高度
        
        // 调整阴影大小
        const shadowBlur3 = this.add.ellipse(0, 110, 200, 60, 0x000000, 0.1);
        const shadowBlur2 = this.add.ellipse(0, 105, 180, 55, 0x000000, 0.2);
        const shadowBlur1 = this.add.ellipse(0, 100, 160, 50, 0x000000, 0.3);
        
        // 调整背景光晕大小
        const bgGlow2 = this.add.graphics();
        bgGlow2.fillStyle(0xffffff, 0.05);
        bgGlow2.fillCircle(0, 0, 160);
        
        const bgGlow1 = this.add.graphics();
        bgGlow1.fillStyle(0xffffff, 0.1);
        bgGlow1.fillCircle(0, 0, 140);
        
        // 调整背景框大小
        const bgFrame = this.add.graphics();
        bgFrame.fillStyle(0x000000, 0.4);
        bgFrame.fillRoundedRect(-108, -158, 216, 316, 20);
        bgFrame.fillStyle(0x2a2a2a, 0.8);
        bgFrame.fillRoundedRect(-105, -155, 210, 310, 20);
        bgFrame.fillStyle(0x3a3a3a, 0.6);
        bgFrame.fillRoundedRect(-102, -152, 204, 304, 20);
        bgFrame.fillStyle(0xffffff, 0.15);
        bgFrame.fillRoundedRect(-100, -150, 200, 300, 20);
        
        // 调整角色光效
        const characterGlow = this.add.graphics();
        characterGlow.fillStyle(0xffffff, 0.1);
        characterGlow.fillCircle(0, 0, 120);
        
        // 增大角色尺寸
        const character = this.add.image(0, 0, type)
            .setScale(1.01);  // 增加15%
        
        // 调整边框大小
        const frame = this.add.graphics();
        frame.lineStyle(8, 0x000000, 0.2);
        frame.strokeRoundedRect(-106, -156, 212, 312, 20);
        frame.lineStyle(6, 0x2a2a2a, 0.8);
        frame.strokeRoundedRect(-103, -153, 206, 306, 20);
        frame.lineStyle(4, 0x4a4a4a, 1);
        frame.strokeRoundedRect(-100, -150, 200, 300, 20);
        frame.lineStyle(3, 0xffffff, 0.4);
        frame.strokeRoundedRect(-98, -148, 196, 296, 18);
        
        // 调整高光位置和大小
        const highlight = this.add.graphics();
        highlight.lineStyle(3, 0xffffff, 0.2);
        highlight.beginPath();
        highlight.arc(-55, -105, 110, 0.7, 1.6, false);
        highlight.strokePath();
        highlight.lineStyle(2, 0xffffff, 0.5);
        highlight.beginPath();
        highlight.arc(-50, -100, 100, 0.8, 1.5, false);
        highlight.strokePath();
        
        // 调整交互光效大小
        const glowOuter = this.add.graphics();
        glowOuter.lineStyle(4, 0xffffff, 0.3);
        glowOuter.strokeCircle(0, 0, 140);
        glowOuter.alpha = 0;
        
        const glow = this.add.graphics();
        glow.lineStyle(3, 0xffffff, 0.7);
        glow.strokeCircle(0, 0, 130);
        glow.alpha = 0;

        // 按照层次添加到容器
        container.add([
            shadowBlur3,
            shadowBlur2,
            shadowBlur1,
            bgGlow2,
            bgGlow1,
            bgFrame,
            characterGlow,
            character,
            frame,
            highlight,
            glowOuter,
            glow
        ]);

        // 悬停效果增强
        container.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                y: y - 15,
                duration: 300,
                ease: 'Back.easeOut'
            });

            // 多层光晕动画
            this.tweens.add({
                targets: [glow, glowOuter],
                alpha: 1,
                duration: 300
            });

            // 角色呼吸动画
            this.tweens.add({
                targets: [character, characterGlow, bgGlow1, bgGlow2],
                scaleX: 0.92,
                scaleY: 0.92,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // 多层阴影动画
            this.tweens.add({
                targets: [shadowBlur1, shadowBlur2, shadowBlur3],
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 300
            });
        });

        container.on('pointerout', () => {
            this.tweens.killTweensOf([
                character, characterGlow, bgGlow1, bgGlow2,
                shadowBlur1, shadowBlur2, shadowBlur3
            ]);
            
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                y: y,
                duration: 300,
                ease: 'Back.easeOut'
            });

            this.tweens.add({
                targets: [glow, glowOuter],
                alpha: 0,
                duration: 300
            });

            this.tweens.add({
                targets: [shadowBlur1, shadowBlur2, shadowBlur3],
                scaleX: 1,
                scaleY: 1,
                duration: 300
            });

            character.setScale(1.01);
            characterGlow.setScale(1);
            bgGlow1.setScale(1);
            bgGlow2.setScale(1);
        });

        // 调整交互区域大小
        container.setSize(containerWidth, containerHeight);
        container.setInteractive();

        container.on('pointerdown', () => {
            this.selectCharacter(type, container, character);
        });
    }

    selectCharacter(type, container, character) {
        this.input.enabled = false;

        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 1);
        flash.fillCircle(container.x, container.y, 150);
        flash.alpha = 0;

        this.tweens.add({
            targets: container,
            scaleX: 1.2,
            scaleY: 1.2,
            y: container.y - 50,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // 闪光效果
                this.tweens.add({
                    targets: flash,
                    alpha: 0.8,
                    duration: 150,  // 加快闪光速度
                    yoyo: true,
                    onComplete: () => {
                        flash.destroy();
                        
                        // 加快翻转动画
                        this.tweens.add({
                            targets: character,
                            scaleX: 0,
                            duration: 200,  // 从400减到200
                            ease: 'Cubic.easeIn',
                            onComplete: () => {
                                character.toggleFlipX();
                                
                                // 加快展开动画
                                this.tweens.add({
                                    targets: character,
                                    scaleX: 1.01,
                                    duration: 200,  // 从400减到200
                                    ease: 'Back.easeOut',
                                    onComplete: () => {
                                        // 弹跳效果
                                        this.tweens.add({
                                            targets: container,
                                            scaleX: 1.1,
                                            scaleY: 0.9,
                                            duration: 100,
                                            yoyo: true,
                                            repeat: 1,
                                            onComplete: () => {
                                                window.gameState.character = type;
                                                this.time.delayedCall(200, () => {  // 从300减到200
                                                    this.scene.start('SceneSelectScene');
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        // 优化未选择角色的淡出效果
        const otherContainer = this.children.list.find(
            child => child.type === 'Container' && 
            child !== container
        );

        if (otherContainer) {
            this.tweens.add({
                targets: otherContainer,
                alpha: 0.3,
                scale: 0.8,
                duration: 300,  // 从400减到300
                ease: 'Power2'
            });
        }
    }

    createBackButton() {
        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button')
            .setDisplaySize(120, 40);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        backButton.add([backBg, backText]);
        backButton.setSize(120, 40);
        backButton.setInteractive();

        backButton.on('pointerover', () => {
            this.tweens.add({
                targets: backBg,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });

        backButton.on('pointerout', () => {
            this.tweens.add({
                targets: backBg,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        backButton.on('pointerdown', () => {
            if (window.gameState) {
                window.gameState.character = null;
            }
            this.scene.start('PreloadScene');
        });
    }
}
