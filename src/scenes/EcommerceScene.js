export default class EcommerceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EcommerceScene' });
        this.packageCount = 0;
        this.boxesCompleted = 0;
        this.timeLeft = 60;
        this.isPlaying = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, 'ecommerce-bg')
            .setDisplaySize(width, height);

        this.add.text(width/2, 50, '农村电商', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        this.createConveyor();
        this.packages = this.add.group();
        this.createPackageBox();

        this.timerText = this.add.text(650, 50, `时间: ${this.timeLeft}`, {
            fontSize: '24px',
            fill: '#000'
        });

        this.boxText = this.add.text(650, 90, `完成箱数: ${this.boxesCompleted}`, {
            fontSize: '24px',
            fill: '#000'
        });

        this.packageText = this.add.text(650, 130, `当前包裹: ${this.packageCount}/10`, {
            fontSize: '24px',
            fill: '#000'
        });

        this.showStartPrompt();
    }

    showStartPrompt() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        const text = this.add.text(width/2, height/2, 
            '农村电商发展迅速\n帮助村民打包快递\n点击开始游戏', {
            fontSize: '28px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            overlay.destroy();
            text.destroy();
            this.startGame();
        });
    }

    startGame() {
        this.isPlaying = true;

        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.packageGenerator = this.time.addEvent({
            delay: 2000,
            callback: this.generatePackage,
            callbackScope: this,
            loop: true
        });
    }

    createConveyor() {
        this.conveyor = this.add.image(400, 500, 'conveyor')
            .setDisplaySize(800, 100);
    }

    createPackageBox() {
        const boxZone = this.add.zone(100, 400, 150, 150)
            .setRectangleDropZone(150, 150);

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(boxZone.x - boxZone.width/2, boxZone.y - boxZone.height/2, 
            boxZone.width, boxZone.height);
    }

    generatePackage() {
        if (!this.isPlaying) return;

        const packageItem = this.add.image(800, 450, 'package')
            .setScale(0.5)
            .setInteractive();

        this.packages.add(packageItem);

        this.input.setDraggable(packageItem);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('drop', (pointer, gameObject, dropZone) => {
            gameObject.destroy();
            this.packageCount++;
            this.packageText.setText(`当前包裹: ${this.packageCount}/10`);

            if (this.packageCount >= 10) {
                this.packageCount = 0;
                this.boxesCompleted++;
                this.boxText.setText(`完成箱数: ${this.boxesCompleted}`);
            }
        });
    }

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`时间: ${this.timeLeft}`);

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    endGame() {
        this.isPlaying = false;
        this.packageGenerator.destroy();
        this.timer.destroy();
        this.packages.clear(true, true);
        this.showResultDialog();
    }

    showResultDialog() {
        let reward = '';
        if (this.boxesCompleted >= 10) {
            reward = '金牌';
        } else if (this.boxesCompleted >= 5) {
            reward = '银牌';
        } else {
            reward = '铜牌';
        }

        const content = [
            "游戏结束！",
            "",
            `你总共完成了 ${this.boxesCompleted} 个箱子的打包`,
            `获得${reward}奖励！`,
            "",
            "点击继续进入下一个场景"
        ].join('\n');

        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRect(100, 100, 600, 400);

        const text = this.add.text(400, 300, content, {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            window.gameState.medals.ecommerce = true;
            this.scene.start('CultureScene');
        });
    }
}
