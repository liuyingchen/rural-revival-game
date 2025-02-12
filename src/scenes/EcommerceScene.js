export default class EcommerceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EcommerceScene' });
        this.packageCount = 0;    // 当前箱子的包裹数
        this.boxesCompleted = 0;  // 完成的箱子数
        this.gameStartTime = 0;   // 游戏开始时间
        this.isPlaying = false;
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

        // 添加返回按钮
        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button').setDisplaySize(120, 40);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        backButton.add([backBg, backText]);
        backButton.setSize(120, 40);
        backButton.setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('SceneSelectScene');
        });

        // 创建包裹箱
        this.createPackageBox();

        // 创建状态文本
        this.boxText = this.add.text(650, 90, `完成箱数: ${this.boxesCompleted}/5`, {
            fontSize: '24px',
            fill: '#000'
        });

        this.packageText = this.add.text(650, 130, `当前包裹: ${this.packageCount}/10`, {
            fontSize: '24px',
            fill: '#000'
        });

        this.timeText = this.add.text(650, 50, '用时: 0秒', {
            fontSize: '24px',
            fill: '#000'
        });

        // 创建包裹图片（可点击）
        this.package = this.add.image(700, 450, 'package')
            .setScale(0.5)
            .setInteractive();

        this.package.on('pointerdown', () => {
            if (this.isPlaying) {
                this.addPackage();
            }
        });

        this.showStartPrompt();
    }

    showStartPrompt() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建半透明黑色背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        // 创建对话框背景
        const dialogBox = this.add.graphics();
        
        // 添加阴影效果
        dialogBox.fillStyle(0x000000, 0.3);
        dialogBox.fillRoundedRect(
            width/2 - 290, 
            height/2 - 140, 
            600, 
            300, 
            20
        );

        // 主对话框
        dialogBox.fillGradientStyle(
            0xFFFFFF, 0xFFFFFF, 0xF0F0F0, 0xF0F0F0,
            1, 1, 0.9, 0.9
        );
        dialogBox.fillRoundedRect(
            width/2 - 300, 
            height/2 - 150, 
            600, 
            300, 
            20
        );

        // 对话框边框
        dialogBox.lineStyle(4, 0x4A90E2);
        dialogBox.strokeRoundedRect(
            width/2 - 300, 
            height/2 - 150, 
            600, 
            300, 
            20
        );

        // 添加标题
        const title = this.add.text(width/2, height/2 - 130, '农村电商', {
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#4A90E2',
            align: 'center'
        }).setOrigin(0.5);

        // 添加装饰线
        const decorLine = this.add.graphics();
        decorLine.lineStyle(2, 0x4A90E2);
        decorLine.beginPath();
        decorLine.moveTo(width/2 - 100, height/2 - 100);
        decorLine.lineTo(width/2 + 100, height/2 - 100);
        decorLine.strokePath();

        // 准备要显示的文字
        const messages = [
            "随着互联网技术的发展，",
            "农村电商正在蓬勃发展，",
            "它为农产品打开了新的销路，",
            "让农民足不出户就能做生意。",
            "",
            "现在，你是一名农村电商从业者，",
            "需要帮助村民们打包快递。",
            "",
            "准备好了吗？点击任意位置开始游戏！"
        ];

        let messageIndex = 0;
        let charIndex = 0;
        let displayLines = [];  // 用于存储当前显示的行
        const maxLines = 4;     // 最大显示行数

        // 创建文本对象
        const text = this.add.text(width/2, height/2, '', {
            fontSize: '24px',
            fill: '#333333',
            align: 'center',
            lineSpacing: 15,
            fontFamily: 'Arial, PingFang SC, Microsoft YaHei'
        }).setOrigin(0.5);

        // 添加提示文本（调整位置）
        const hintText = this.add.text(width/2, height/2 + 130, '点击任意位置继续...', {
            fontSize: '18px',
            fill: '#666666',
            align: 'center'
        }).setOrigin(0.5);

        // 让提示文本闪烁
        this.tweens.add({
            targets: hintText,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            yoyo: true,
            repeat: -1
        });

        // 添加打字机效果
        const typing = this.time.addEvent({
            delay: 50,
            callback: () => {
                if (messageIndex < messages.length) {
                    if (charIndex < messages[messageIndex].length) {
                        // 添加新字符
                        if (displayLines.length === 0) {
                            displayLines.push('');
                        }
                        displayLines[displayLines.length - 1] += messages[messageIndex][charIndex];
                        charIndex++;
                    } else {
                        // 完成一行
                        messageIndex++;
                        charIndex = 0;
                        if (messageIndex < messages.length) {
                            displayLines.push('');
                            // 如果超过最大行数，移除第一行
                            if (displayLines.length > maxLines) {
                                displayLines.shift();
                            }
                        }
                    }
                    // 更新显示的文本
                    text.setText(displayLines.join('\n'));
                }
            },
            repeat: -1
        });

        // 点击任意位置关闭对话框并开始游戏
        this.input.once('pointerdown', () => {
            typing.destroy();
            overlay.destroy();
            dialogBox.destroy();
            text.destroy();
            title.destroy();
            decorLine.destroy();
            hintText.destroy();
            this.startGame();
        });
    }

    createPackageBox() {
        const boxZone = this.add.zone(100, 400, 150, 150)
            .setRectangleDropZone(150, 150);

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(
            boxZone.x - boxZone.width/2, 
            boxZone.y - boxZone.height/2, 
            boxZone.width, 
            boxZone.height
        );
    }

    startGame() {
        this.isPlaying = true;
        this.gameStartTime = Date.now();
        
        // 开始计时
        this.timer = this.time.addEvent({
            delay: 100,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.timeText.setText(`用时: ${elapsed}秒`);
    }

    addPackage() {
        this.packageCount++;
        this.packageText.setText(`当前包裹: ${this.packageCount}/10`);

        if (this.packageCount >= 10) {
            // 一个箱子装满了
            this.packageCount = 0;
            this.boxesCompleted++;
            this.boxText.setText(`完成箱数: ${this.boxesCompleted}/5`);

            // 显示箱子完成的提示
            if (this.boxesCompleted < 5) {
                this.showBoxCompletedMessage();
            } else {
                // 所有箱子都完成了
                this.endGame();
            }
        }
    }

    showBoxCompletedMessage() {
        // 创建提示背景
        const messageBox = this.add.graphics();
        messageBox.fillStyle(0x000000, 0.7);
        messageBox.fillRect(200, 250, 400, 100);

        // 创建提示文本
        const message = this.add.text(400, 300, 
            `第 ${this.boxesCompleted} 个箱子打包完成！\n继续打包下一个箱子...`, {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // 2秒后自动消失
        this.time.delayedCall(2000, () => {
            messageBox.destroy();
            message.destroy();
        });
    }

    endGame() {
        this.isPlaying = false;
        this.timer.destroy();

        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        let reward = '';
        
        if (elapsed <= 60) {
            reward = '金牌';
        } else if (elapsed <= 90) {
            reward = '银牌';
        } else {
            reward = '铜牌';
        }

        // 创建半透明背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, 800, 600);

        // 创建结果对话框
        const dialogBox = this.add.graphics();
        dialogBox.fillStyle(0xFFFFFF, 1);
        dialogBox.fillRoundedRect(200, 100, 400, 400, 20);
        dialogBox.lineStyle(4, 0x4A90E2);
        dialogBox.strokeRoundedRect(200, 100, 400, 400, 20);

        const content = [
            "恭喜完成！",
            "",
            `你用时 ${elapsed} 秒完成了 5 个箱子的打包`,
            `总共打包了 50 个包裹`,
            `获得${reward}奖励！`,
            "",
            "点击关闭",
            "",
            "可以点击左上角返回按钮",
            "返回选择界面"
        ].join('\n');

        const text = this.add.text(400, 300, content, {
            fontSize: '24px',
            fill: '#333333',
            align: 'center'
        }).setOrigin(0.5);

        // 点击关闭结果对话框，但保持在当前场景
        this.input.once('pointerdown', () => {
            window.gameState.medals.ecommerce = true;
            overlay.destroy();
            dialogBox.destroy();
            text.destroy();
        });
    }
}
