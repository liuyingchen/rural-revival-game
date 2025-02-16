export default class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, 'main-bg')
            .setDisplaySize(width, height);

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
            backBg.setScale(1.1);
            backText.setScale(1.1);
        });

        backButton.on('pointerout', () => {
            backBg.setScale(1);
            backText.setScale(1);
        });

        backButton.on('pointerdown', () => {
            if (window.gameState) {
                window.gameState.character = null;
            }
            this.scene.start('PreloadScene');
        });

        this.add.text(width/2, 100, '选择你的角色', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        this.maleButton = this.add.image(width/3, height/2, 'male')
            .setInteractive()
            .setScale(0.88);

        this.femaleButton = this.add.image(width*2/3, height/2, 'female')
            .setInteractive()
            .setScale(0.88);

        this.add.text(width/3, height/2 + 150, '男性角色', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

        this.add.text(width*2/3, height/2 + 150, '女性角色', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

        this.maleButton.on('pointerdown', () => this.selectCharacter('male', this.maleButton));
        this.femaleButton.on('pointerdown', () => this.selectCharacter('female', this.femaleButton));

        [this.maleButton, this.femaleButton].forEach(button => {
            button.on('pointerover', () => {
                this.tweens.add({
                    targets: button,
                    scale: 0.95,
                    duration: 200
                });
            });

            button.on('pointerout', () => {
                this.tweens.add({
                    targets: button,
                    scale: 0.88,
                    duration: 200
                });
            });
        });
    }

    selectCharacter(character, selectedChar) {
        this.maleButton.disableInteractive();
        this.femaleButton.disableInteractive();

        const createCircle = (radius, alpha, delay) => {
            const circle = this.add.circle(
                selectedChar.x,
                selectedChar.y,
                radius,
                0xFFFFFF,
                alpha
            );

            this.tweens.add({
                targets: circle,
                scale: 3,
                alpha: 0,
                duration: 800,
                delay: delay,
                ease: 'Cubic.out',
                onComplete: () => circle.destroy()
            });
        };

        createCircle(80, 0.4, 0);
        createCircle(80, 0.3, 200);
        createCircle(80, 0.2, 400);

        this.tweens.add({
            targets: selectedChar,
            scaleX: 0,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                selectedChar.toggleFlipX();
                
                this.tweens.add({
                    targets: selectedChar,
                    scaleX: 0.88,
                    duration: 400,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        this.tweens.add({
                            targets: selectedChar,
                            scaleX: 0,
                            duration: 400,
                            ease: 'Cubic.easeIn',
                            onComplete: () => {
                                selectedChar.toggleFlipX();
                                
                                this.tweens.add({
                                    targets: selectedChar,
                                    scaleX: 1,
                                    duration: 400,
                                    ease: 'Back.easeOut',
                                    onComplete: () => {
                                        this.tweens.add({
                                            targets: selectedChar,
                                            scaleY: 0.9,
                                            duration: 100,
                                            yoyo: true,
                                            repeat: 1,
                                            onComplete: () => {
                                                this.time.delayedCall(300, () => {
                                                    window.gameState.character = character;
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

        const unselectedChar = character === 'male' ? this.femaleButton : this.maleButton;
        this.tweens.add({
            targets: unselectedChar,
            alpha: 0.3,
            duration: 400,
            ease: 'Linear'
        });
    }
}
