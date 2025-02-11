export default class EcommerceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EcommerceScene' });
        this.packageCount = 0;        // 当前箱子中的包裹数
        this.boxesCompleted = 0;      // 完成的箱子数
        this.timeLeft = 60;           // 游戏时间（秒）
        this.isPlaying = false;       // 游戏是否开始
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景
        this.add.image(width/2, height/2, 'ecommerce-bg')
            .setDisplaySize(width, height);

        // 添加标题
        this.add.text(width/2, 50, '农村电商', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        // 创建传送带
        this.createConveyor();

        // 创建包裹组
        this.packages = this.add.group();

        // 创建打包箱
        this.createPackageBox();

        // 创建计时器文本
        this.timerText = this.add.text(650, 50, `时间: ${this.timeLeft}`, {
            fontSize: '24px',
            fill: '#000'
        });

        // 创建完成箱子数文本
        this.boxText = this.add.text(650, 90, `完成箱数: ${this.boxesCompleted}`, {
            fontSize: '24px',
            fill: '#000'
        });

        // 创建当前包裹数文本
        this.packageText = this.add.text(650, 130, `当前包裹: ${this.packageCount}/10`, {
            fontSize: '24px',
            fill: '#000'
        });

        // 显示开始游戏提示
        this.showStartPrompt();
    }

    showStartPrompt() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建半透明背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        // 添加说明文本
        const text = this.add.text(width/2, height/2, 
            '农村电商发展迅速\n帮助村民打包快递\n点击开始游戏', {
            fontSize: '28px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // 点击开始游戏
        this.input.once('pointerdown', () => {
            overlay.destroy();
            text.destroy();
            this.startGame();
        });
    }

    startGame() {
        this.isPlaying = true;

        // 创建计时器
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // 创建包裹生成器
        this.packageGenerator = this.time.addEvent({
            delay: 2000,
            callback: this.generatePackage,
            callbackScope: this,
            loop: true
        });
    }

    createConveyor() {
        // 创建传送带
        this.conveyor = this.add.image(400, 500, 'conveyor')
            .setDisplaySize(800, 100);
    }

    createPackageBox() {
        // 创建打包箱区域
        const boxZone = this.add.zone(100, 400, 150, 150)
            .setRectangleDropZone(150, 150);

        // 显示打包区域
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

        // 设置包裹可拖动
        this.input.setDraggable(packageItem);

        // 添加拖动事件
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        // 添加放下事件
        this.input.on('drop', (pointer, gameObject, dropZone) => {
            gameObject.destroy();
            this.packageCount++;
            this.packageText.setText(`当前包裹: ${this.packageCount}/10`);

            // 检查是否完成一个箱子
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

        // 显示结算界面
        this.showResultDialog();
    }

    showResultDialog() {
        // TODO: 这里的奖励规则可以配置
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

        // 点击继续
        this.input.once('pointerdown', () => {
            // 保存奖牌状态
            window.gameState.medals.ecommerce = true;
            // 跳转到文化场景
            this.scene.start('CultureScene');
        });
    }
} 