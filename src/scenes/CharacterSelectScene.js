export default class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    init() {
        console.log('CharacterSelectScene - init');
    }

    create() {
        console.log('CharacterSelectScene - create');
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加标题
        this.add.text(width/2, 100, '选择你的角色', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        // 创建男性角色按钮
        const maleButton = this.add.image(width/3, height/2, 'male')
            .setInteractive()
            .setScale(0.8);

        // 创建女性角色按钮
        const femaleButton = this.add.image(width*2/3, height/2, 'female')
            .setInteractive()
            .setScale(0.8);

        // 添加选择提示文本
        this.add.text(width/3, height/2 + 150, '男性角色', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

        this.add.text(width*2/3, height/2 + 150, '女性角色', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

        // 添加角色选择事件
        maleButton.on('pointerdown', () => {
            this.selectCharacter('male');
        });

        femaleButton.on('pointerdown', () => {
            this.selectCharacter('female');
        });
    }

    selectCharacter(character) {
        // 保存选择的角色
        window.gameState.character = character;
        
        // 跳转到场景选择界面（而不是直接进入电商场景）
        this.scene.start('SceneSelectScene');
    }
} 