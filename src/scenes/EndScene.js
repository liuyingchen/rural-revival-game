export default class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, 'main-bg')
            .setDisplaySize(width, height);

        this.add.text(width/2, 100, '游戏完成！', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        // 显示获得的奖牌
        const medals = [];
        if (window.gameState.medals.ecommerce) medals.push('农村电商');
        if (window.gameState.medals.culture) medals.push('文化乡村');
        if (window.gameState.medals.agriculture) medals.push('现代化农业');

        const medalText = medals.length > 0 
            ? `获得奖牌：${medals.join('、')}`
            : '继续加油！';

        this.add.text(width/2, height/2, medalText, {
            fontSize: '24px',
            fill: '#000000',
            align: 'center'
        }).setOrigin(0.5);

        // 重新开始按钮
        const restartButton = this.add.container(width/2, height - 100);
        const restartBg = this.add.image(0, 0, 'button').setDisplaySize(200, 60);
        const restartText = this.add.text(0, 0, '重新开始', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        restartButton.add([restartBg, restartText]);
        restartButton.setSize(200, 60);
        restartButton.setInteractive();

        restartButton.on('pointerdown', () => {
            // 重置游戏状态
            window.gameState = {
                character: null,
                medals: {
                    ecommerce: false,
                    culture: false,
                    agriculture: false
                }
            };
            this.scene.start('CharacterSelectScene');
        });

        // 添加悬停效果
        restartButton.on('pointerover', () => {
            restartButton.first.setScale(1.1);
        });

        restartButton.on('pointerout', () => {
            restartButton.first.setScale(1);
        });
    }
}
