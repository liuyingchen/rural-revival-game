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

        const maleButton = this.add.image(width/3, height/2, 'male')
            .setInteractive()
            .setScale(0.8);

        const femaleButton = this.add.image(width*2/3, height/2, 'female')
            .setInteractive()
            .setScale(0.8);

        this.add.text(width/3, height/2 + 150, '男性角色', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

        this.add.text(width*2/3, height/2 + 150, '女性角色', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

        maleButton.on('pointerdown', () => {
            this.selectCharacter('male');
        });

        femaleButton.on('pointerdown', () => {
            this.selectCharacter('female');
        });
    }

    selectCharacter(character) {
        window.gameState.character = character;
        this.scene.start('SceneSelectScene');
    }
}
