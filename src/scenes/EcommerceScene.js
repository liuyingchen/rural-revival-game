import { playerManager } from '../managers/PlayerManager.js';

export default class EcommerceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EcommerceScene' });
        
        // 初始化游戏状态
        if (!window.gameState) {
            window.gameState = {
                medals: {},
                character: 'female'
            };
        }
        if (!window.gameState.medals) {
            window.gameState.medals = {};
        }
        if (window.gameState.medals.ecommerce === undefined) {
            window.gameState.medals.ecommerce = null;  // 或者 false
        }

        // 其他初始化
        this.isPlaying = false;
        this.score = 0;
        this.totalBoxes = 0;
        this.packedBoxes = 0;
        this.gameStartTime = 0;
        this.boxCount = 0;        // 已完成的箱子数
        this.targetBoxCount = 20; // 目标箱子数改为20
        this.isPackingAnimating = false;  // 添加角色动画状态标记
        // 添加奖牌时间标准
        this.medalTimes = {
            gold: 30,    // 30秒内完成获得金牌
            silver: 45,  // 45秒内完成获得银牌
            bronze: 60   // 60秒内完成获得铜牌
        };

        // 初始化箱子管理
        this.movingBoxes = [];
        this.lastBoxCreationTime = 0;
        this.boxCreationInterval = 1000; // 箱子创建间隔，毫秒
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 添加背景
        this.add.image(width/2, height/2, 'ecommerce-bg')
            .setDisplaySize(width, height);

        // 创建并播放背景音乐
        try {
            this.bgm = this.sound.add('ecommerce-bgm', {
                loop: true,
                volume: 0.5
            });
            this.bgm.play();
        } catch (error) {
            console.warn('Background music failed to load:', error);
        }

        // 添加选中的角色
        const characterType = window.gameState.character || 'female';
        this.player = this.add.sprite(
            width * 0.10,  // 修改为与 CultureScene 相同的位置
            height * 0.75,  // 修改为与 CultureScene 相同的位置
            characterType
        ).setScale(height * 0.001)  // 使用相同的缩放比例
        .setDepth(99);  // 使用相同的深度值

        // 添加返回按钮
        const backButton = this.add.image(width * 0.05, height * 0.1, 'back')
            .setScale(0.6)
            .setDepth(2)
            .setInteractive()
            .on('pointerdown', () => {
                // 停止背景音乐
                if (this.bgm) {
                    this.bgm.stop();
                    this.bgm.destroy();
                }
                // 返回场景选择
                this.scene.start('SceneSelectScene');
            });

        // 添加返回按钮的悬停效果
        backButton.on('pointerover', () => {
            backButton.setScale(0.65);
        });
        
        backButton.on('pointerout', () => {
            backButton.setScale(0.6);
        });

        // 初始化状态文本（显示0s）
        this.timeText = this.add.text(width - 200, 20, 'Time: 0s', {
            fontSize: Math.min(width, height) * 0.03 + 'px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(2);

        this.boxText = this.add.text(width - 200, 70, `Box: ${this.boxCount}/${this.targetBoxCount}`, {
            fontSize: Math.min(width, height) * 0.03 + 'px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(2);

        // 检查是否已经获得奖牌，如果没有则显示欢迎弹窗
        if (window.gameState.medals.ecommerce) {
            console.log(window.gameState.medals.ecommerce);
            this.startGame();
        } else {
            this.showWelcomeDialog();
        }

     //////////////////////以上不需要动//////////


        // 传送带位置和尺寸调整
        this.conveyor = this.add.image(this.cameras.main.centerX, this.cameras.main.height * 0.7, 'conveyor')
            .setScale(this.scale.height * 0.001);
        
        // 添加红色和黄色拳头按钮 - 使用与箱子相同的坐标系统
        this.redFist = this.add.sprite(
            this.cameras.main.width * 0.7,
            this.cameras.main.height * 0.3,
            'red'
        ).setScale(this.scale.height * 0.0005 * 0.4);
        
        this.yellowFist = this.add.sprite(
            this.cameras.main.width * 0.8,
            this.cameras.main.height * 0.3,
            'yellow'
        ).setScale(this.scale.height * 0.0005 * 0.4);
        
        // 打印拳头位置信息以便调试
        console.log('红色拳头位置:', this.redFist.x, this.redFist.y);
        console.log('黄色拳头位置:', this.yellowFist.x, this.yellowFist.y);
        console.log('传送带位置:', this.conveyor.x, this.conveyor.y);
        
        // 确保拳头是可交互的
        this.redFist.setInteractive({ useHandCursor: true });
        this.yellowFist.setInteractive({ useHandCursor: true });

        // 设置拳头在最上层
        this.redFist.setDepth(100);
        this.yellowFist.setDepth(100);

        // 添加鼠标悬停效果
        this.redFist.on('pointerover', function() {
            this.setTint(0xff9999);
        });
        this.redFist.on('pointerout', function() {
            this.clearTint();
        });

        this.yellowFist.on('pointerover', function() {
            this.setTint(0xffff99);
        });
        this.yellowFist.on('pointerout', function() {
            this.clearTint();
        });

        // 设置点击事件和动画效果
        this.redFist.on('pointerdown', () => {
            console.log('红色拳头被点击');
            
            // 创建拳头下移动画
            this.tweens.add({
                targets: this.redFist,
                y: this.redFist.y + 50,  // 向下移动50像素
                duration: 100,           // 持续100毫秒
                ease: 'Power1',
                yoyo: true,              // 动画完成后返回原位置
                onComplete: () => {
                    // 动画完成后调用分类函数
                    this.sortBox('red');
                }
            });
        });

        this.yellowFist.on('pointerdown', () => {
            console.log('黄色拳头被点击');
            
            // 创建拳头下移动画
            this.tweens.add({
                targets: this.yellowFist,
                y: this.yellowFist.y + 50,  // 向下移动50像素
                duration: 100,              // 持续100毫秒
                ease: 'Power1',
                yoyo: true,                 // 动画完成后返回原位置
                onComplete: () => {
                    // 动画完成后调用分类函数
                    this.sortBox('yellow');
                }
            });
        });
        
        // 添加收集区域
        this.redSortingArea = this.add.rectangle(
            this.cameras.main.width * 0.7, 
            this.cameras.main.height * 0.85, 
            200, 100, 
            0xff0000, 0.3
        ).setOrigin(0.5);
        
        this.yellowSortingArea = this.add.rectangle(
            this.cameras.main.width * 0.85, 
            this.cameras.main.height * 0.85, 
            200, 100, 
            0xffff00, 0.3
        ).setOrigin(0.5);
        
        // 添加文字标签
        this.add.text(this.redSortingArea.x, this.redSortingArea.y, 'sorting area', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(this.yellowSortingArea.x, this.yellowSortingArea.y, 'sorting area', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // 初始化游戏变量
        this.boxCount = 0;
        this.targetBoxCount = 20;
        this.movingBoxes = [];
        this.currentBox = null;
        

    }

    showWelcomeDialog() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 创建半透明黑色遮罩
        const overlay = this.add.graphics()
            .setDepth(98);
        overlay.fillStyle(0x000000, 0.3);
        overlay.fillRect(0, 0, width, height);

        // 弹窗尺寸和位置
        const boxWidth = width * 0.8;
        const boxHeight = height * 0.25;
        const boxY = height * 0.75;

        // 创建弹窗背景
        const messageBox = this.add.graphics()
            .setDepth(98);
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(
            width/2 - boxWidth/2,
            boxY - boxHeight/2,
            boxWidth,
            boxHeight,
            20
        );
        messageBox.strokeRoundedRect(
            width/2 - boxWidth/2,
            boxY - boxHeight/2,
            boxWidth,
            boxHeight,
            20
        );

        // 创建文本容器和遮罩
        const textContainer = this.add.container(0, 0).setDepth(99);
        const textMask = this.add.graphics()
            .fillStyle(0xffffff)
            .fillRect(
                width/2 - boxWidth/2,
                boxY - boxHeight/2,
                boxWidth,
                boxHeight
            );
        textContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, textMask));

        // 创建固定数量的文本对象
        const textObjects = [];
        const maxLines = 4;
        const startY = boxY - boxHeight/2 + 25;
        const lineSpacing = boxHeight / 5;

        // 创建文本对象
        for (let i = 0; i < maxLines; i++) {
            const text = this.add.text(
                width/2 - boxWidth/2 + 40,
                startY + i * lineSpacing,
                '',
                {
                    fontSize: '20px',
                    fill: '#4A3000',
                    align: 'left',
                    wordWrap: { width: boxWidth - 80 }
                }
            )
            .setOrigin(0, 0.5);
            textObjects.push(text);
            textContainer.add(text);
        }

        // 打字机效果
        const typewriterEffect = (textObject, fullText) => {
            return new Promise((resolve) => {
                let currentText = '';
                let currentIndex = 0;
                
                const timer = this.time.addEvent({
                    delay: 30,
                    callback: () => {
                        if (!textObject || !textObject.scene) {
                            timer.destroy();
                            resolve();
                            return;
                        }

                        if (currentIndex < fullText.length) {
                            currentText += fullText[currentIndex];
                            textObject.setText(currentText);
                            currentIndex++;
                        } else {
                            timer.destroy();
                            resolve();
                        }
                    },
                    loop: true
                });

                this.events.once('shutdown', () => {
                    timer.destroy();
                    resolve();
                });
            });
        };

        // 欢迎文本内容
        const allTextLines = [
            "Dear Pakistani friend, welcome to the village express station!",
            "As logistics commander, click to pack parcels marked for cities.",
            "Each package you seal helps better the urban developent."
        ];

        // 显示文本
        const showNextLine = async (index) => {
            if (index < allTextLines.length) {
                await typewriterEffect(textObjects[index], allTextLines[index]);
                if (index + 1 < allTextLines.length) {
                    await showNextLine(index + 1);
                }
            }
        };

        // 开始显示第一行
        showNextLine(0);

        // 点击任意位置关闭弹窗并开始游戏
        this.input.once('pointerdown', () => {
            // 清理弹窗
            messageBox.destroy();
            overlay.destroy();
            textContainer.destroy();
            textMask.destroy();
            textObjects.forEach(text => {
                if (text && text.scene) text.destroy();
            });

            // 开始游戏
            this.startGame();

            // 记录开始时间
            this.gameStartTime = Date.now();
        });
    }

    startGeneratingBoxes() {
        // 创建第一个箱子
        this.createNewBox();
        
        // 设置定时器，定期创建新箱子
        this.boxTimer = this.time.addEvent({
            delay: 2000,  // 增加到5000毫秒（5秒），延长箱子生成间隔
            callback: this.createNewBox,
            callbackScope: this,
            loop: true
        });
    }

    createNewBox() {
        // 检查是否已达到目标数量
        if (this.boxCount >= this.targetBoxCount) {
            return;
        }
        
        // 检查传送带起点是否已有箱子
        const startX = this.conveyor.x - this.conveyor.width * 0.4;
        const startY = this.conveyor.y - 130;
        const boxesAtStart = this.movingBoxes.filter(box => 
            Math.abs(box.x - startX) < 100
        );
        
        if (boxesAtStart.length > 0) {
            console.log('传送带起点已有箱子，跳过创建');
            return;
        }
        
        // 随机决定箱子颜色
        const boxType = Math.random() > 0.5 ? 'red' : 'yellow';
        const boxTexture = boxType === 'red' ? 'red_box' : 'yellow_box';
        
        // 创建唯一ID
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        
        // 创建新箱子
        const box = this.add.image(startX, startY, boxTexture)
            .setScale(this.scale.height * 0.0004 * 0.3);
        
        // 设置箱子属性
        box.boxType = boxType;
        box.id = uniqueId;
        
        console.log(`创建新${boxType}箱子，ID: ${box.id}, 位置: x=${box.x}, y=${box.y}`);
        
        // 将箱子添加到移动箱子列表
        this.movingBoxes.push(box);
        this.currentBox = box;
        
        // 箱子沿传送带移动 - 第一段
        this.tweens.add({
            targets: box,
            x: this.conveyor.x + this.conveyor.width * 0.4,
            duration: 5000,
            ease: 'Linear',
            onComplete: () => {
                // 检查箱子是否仍在移动列表中
                if (!this.movingBoxes.includes(box)) {
                    console.log(`箱子ID: ${box.id} 已不在移动列表中，跳过后续动画`);
                    return;
                }
                
                // 箱子继续移动到传送带右侧 - 第二段
                this.tweens.add({
                    targets: box,
                    x: this.conveyor.x + this.conveyor.width * 0.9,
                    duration: 5000,
                    ease: 'Linear',
                    onComplete: () => {
                        // 再次检查箱子是否仍在移动列表中
                        if (!this.movingBoxes.includes(box)) {
                            console.log(`箱子ID: ${box.id} 已不在移动列表中，跳过销毁`);
                            return;
                        }
                        
                        console.log(`箱子ID: ${box.id} 到达终点，准备移除`);
                        
                        // 从移动箱子列表中移除
                        const index = this.movingBoxes.indexOf(box);
                        if (index > -1) {
                            this.movingBoxes.splice(index, 1);
                        }
                        
                        // 淡出效果
                        this.tweens.add({
                            targets: box,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => {
                                box.destroy();
                                console.log(`箱子ID: ${box.id} 已销毁`);
                            }
                        });
                    }
                });
            }
        });
    }

    sortBox(fistColor) {
        console.log(`尝试分类${fistColor}箱子`);
        
        // 获取当前拳头的位置
        const fist = fistColor === 'red' ? this.redFist : this.yellowFist;
        
        console.log(`${fistColor}拳头位置: x=${fist.x}, y=${fist.y}`);
        
        // 查找所有颜色匹配的箱子
        let colorMatchingBoxes = this.movingBoxes.filter(box => box.boxType === fistColor);
        
        if (colorMatchingBoxes.length === 0) {
            console.log(`传送带上没有${fistColor}颜色的箱子`);
            return;
        }
        
        console.log(`找到${colorMatchingBoxes.length}个${fistColor}颜色的箱子`);
        
        // 打印所有颜色匹配箱子的位置信息
        colorMatchingBoxes.forEach((box, index) => {
            console.log(`${fistColor}箱子 #${index+1}: ID=${box.id}, 位置x=${box.x}, y=${box.y}`);
        });
        
        // 选择水平距离最近的箱子
        const targetBox = colorMatchingBoxes.reduce((closest, current) => {
            const closestDistance = Math.abs(closest.x - fist.x);
            const currentDistance = Math.abs(current.x - fist.x);
            return currentDistance < closestDistance ? current : closest;
        }, colorMatchingBoxes[0]);
        
        // 计算最近箱子与拳头的距离
        const distance = Math.abs(targetBox.x - fist.x);
        console.log(`选择的${fistColor}箱子: ID=${targetBox.id}, 位置x=${targetBox.x}, y=${targetBox.y}, 距离=${distance}`);
        
        // 设置最大有效距离（可以根据游戏需要调整）
        const maxDistance = 100; // 像素
        
        // 检查距离是否在有效范围内
        if (distance > maxDistance) {
            console.log(`箱子距离(${distance})超出有效范围(${maxDistance})，无法分类`);
            return;
        }
        
        // 处理选中的箱子
        const box = targetBox;
        
        // 播放分类音效
        this.sound.play('package-sound', { volume: 0.8 });
        
        // 立即停止所有与该箱子相关的动画
        this.tweens.killTweensOf(box);
        
        // 确保箱子完全消失
        box.setVisible(false);
        box.setActive(false);
        
        // 从移动箱子列表中移除
        const index = this.movingBoxes.indexOf(box);
        if (index > -1) {
            this.movingBoxes.splice(index, 1);
            console.log(`箱子ID: ${box.id} 已从移动列表中移除，剩余箱子: ${this.movingBoxes.length}`);
        } else {
            console.log(`警告：箱子ID: ${box.id} 不在移动列表中！`);
        }
        
        // 增加计数
        this.boxCount++;
        this.boxText.setText(`Box: ${this.boxCount}/${this.targetBoxCount}`);
        
        // 检查是否达到目标
        if (this.boxCount >= this.targetBoxCount) {
            this.gameOver(true);
        }
        
        // 销毁箱子对象
        box.destroy();
        console.log(`箱子ID: ${box.id} 已被销毁`);
        
        console.log(`成功分类${fistColor}箱子，当前计数: ${this.boxCount}/${this.targetBoxCount}`);
        
        // 检查剩余箱子是否有重复ID
        const boxIds = new Set();
        const duplicateIds = [];
        
        this.movingBoxes.forEach(box => {
            if (boxIds.has(box.id)) {
                duplicateIds.push(box.id);
            } else {
                boxIds.add(box.id);
            }
        });
        
        if (duplicateIds.length > 0) {
            console.warn(`警告：发现重复ID的箱子: ${duplicateIds.join(', ')}`);
        }
        
        // 打印剩余箱子信息
        console.log(`剩余箱子数量: ${this.movingBoxes.length}`);
        this.movingBoxes.forEach((box, i) => {
            console.log(`剩余箱子 #${i+1}: ID=${box.id}, 类型=${box.boxType}, 位置x=${box.x}, y=${box.y}`);
        });
    }

    gameOver(success) {
        // 停止生成箱子
        if (this.boxTimer) {
            this.boxTimer.remove();
        }
        
        // 清除所有移动中的箱子
        this.movingBoxes.forEach(box => box.destroy());
        this.movingBoxes = [];
        
        this.isPlaying = false;
        if (this.timer) {
            this.timer.destroy();
        }
        
        if (success) {
            this.onGameComplete();
        } else {
            // 显示失败信息
            const failText = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                '分类错误！游戏失败',
                { fontSize: '32px', fill: '#ff0000' }
            ).setOrigin(0.5);
            
            this.time.delayedCall(2000, () => {
                failText.destroy();
                this.scene.restart();
            });
        }
    }

    startGame() {
        this.isPlaying = true;
         // 开始生成箱子
    this.startGeneratingBoxes();
        this.gameStartTime = Date.now();
        
        // 开始计时
        this.timer = this.time.addEvent({
            delay: 100,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
        this.boxTimer = this.time.addEvent({
            delay: 2000,  // 增加到5000毫秒（5秒），延长箱子生成间隔
            callback: this.createNewBox,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.timeText.setText(`Time: ${elapsedSeconds}s`);
    }

    onGameComplete() {
    if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
        }
        // 先显示完成界面
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        let medalLevel = null;
        console.log('onGameComplete called', elapsed);
        if (elapsed <= this.medalTimes.gold) {
            medalLevel = 'gold';
        } else if (elapsed <= this.medalTimes.silver) {
            medalLevel = 'silver';
        } else {
            medalLevel = 'bronze';
        }
        console.log('Medal level:', medalLevel);

        // 更新玩家奖励
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.medals) window.gameState.medals = {};
        window.gameState.medals.ecommerce = medalLevel;
        
        // 显示完成界面并同时播放音效
        this.showCompletionMessage(medalLevel);
    }

    showCompletionMessage(medalLevel) {
        // 播放完成音效
        const finishSound = this.sound.add('finish', { 
            volume: 0.8,
            loop: false
        });
        finishSound.play();

        // 音效播放完成后清理资源
        finishSound.once('complete', () => {
            finishSound.destroy();
        });

        // 显示完成界面
        this.isPlaying = false;
        
        // 获取游戏完成时间
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);

        // 添加奖励背景
        const bg = this.add.image(this.scale.width/2, this.scale.height/2, 'reward-bg')
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(5);

        // 添加 CONGRATULATIONS 标题
        const title = this.add.text(this.scale.width/2, this.scale.height * 0.2, 'CONGRATULATIONS', {
            fontSize: '48px',
            fontWeight: 'bold',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        })
        .setOrigin(0.5)
        .setDepth(6);

        // 添加奖牌图片
        const medalImage = this.add.image(this.scale.width/2, this.scale.height * 0.45, `${medalLevel}`)
            .setScale(0.4)
            .setDepth(6);

        // 添加 PASS 文本
        const passText = this.add.text(this.scale.width/2, this.scale.height * 0.65, 
            `${medalLevel.toUpperCase()} PASS`, {
            fontSize: '36px',
            fontWeight: 'bold',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(6);

        // 添加完成时间文本
        const timeText = this.add.text(this.scale.width/2, this.scale.height * 0.75, 
            `Time: ${elapsed}s`, {
            fontSize: '24px',
            fill: '#FFFFFF'
        })
        .setOrigin(0.5)
        .setDepth(6);

        // 添加按钮
        const buttonY = this.scale.height * 0.85;
        const buttonSpacing = 150;

        // 再试一次按钮
        const tryAgainBtn = this.add.image(this.scale.width/2 - buttonSpacing, buttonY, 'try-again-btn')
            .setScale(0.8)
            .setInteractive()
            .setDepth(6);

        // 其他游戏按钮
        const otherGamesBtn = this.add.image(this.scale.width/2 + buttonSpacing, buttonY, 'other-games-btn')
            .setScale(0.8)
            .setInteractive()
            .setDepth(6);

        // 添加按钮交互效果
        [tryAgainBtn, otherGamesBtn].forEach(btn => {
            btn.on('pointerover', () => {
                btn.setScale(0.85);
            });
            btn.on('pointerout', () => {
                btn.setScale(0.8);
            });
        });

        // 添加按钮点击事件
        tryAgainBtn.on('pointerdown', () => {
            this.scene.restart();
        });

        otherGamesBtn.on('pointerdown', () => {
            this.scene.start('SceneSelectScene');
        });

        // 添加奖牌动画效果
        this.tweens.add({
            targets: medalImage,
            scale: { from: 0.2, to: 0.4 },
            duration: 1000,
            ease: 'Back.out',
            onComplete: () => {
                this.tweens.add({
                    targets: medalImage,
                    scale: { from: 0.4, to: 0.425 },
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    // 添加更新方法
    update(time, delta) {
        if (this.isPlaying && this.cursors) {  // 添加 this.cursors 检查
            if (this.cursors.left.isDown) {
                this.player.x -= 4;
                this.player.setFlipX(true);
            }
            else if (this.cursors.right.isDown) {
                this.player.x += 4;
                this.player.setFlipX(false);
            }

            // 限制角色移动范围
            this.player.x = Phaser.Math.Clamp(
                this.player.x,
                100,
                this.cameras.main.width - 100
            );
        }

        // 检查是否应该创建新箱子
        // const currentTime = this.time.now;
        // if (currentTime - this.lastBoxCreationTime > this.boxCreationInterval) {
        //     this.createNewBox();
        //     this.lastBoxCreationTime = currentTime;
        // }
    }

    // 添加箱子提示动画
    addBoxHintAnimations() {
        // 1. 添加上下浮动动画
        this.tweens.add({
            targets: this.openBox,
            y: this.openBox.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 2. 添加点击提示光圈
        const circle = this.add.circle(
            this.openBox.x,
            this.openBox.y,
            50,
            0xffff00,
            0.3
        );

        // 光圈动画
        this.tweens.add({
            targets: circle,
            scale: 1.5,
            alpha: 0,
            duration: 1000,
            repeat: -1,
            ease: 'Cubic.easeOut'
        });

        // 3. 添加发光效果（替代闪光效果）
        const glow = this.add.circle(
            this.openBox.x,
            this.openBox.y,
            30,
            0xffff00,
            0.6
        );

        this.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 1.5,
            duration: 1500,
            repeat: -1,
            ease: 'Cubic.easeOut'
        });

        // 4. 当点击箱子时，移除所有提示动画
        this.openBox.on('pointerdown', () => {
            if (this.isPlaying) {
                // 移除提示效果
                circle.destroy();
                glow.destroy();
                // 重置箱子位置
                this.openBox.y = this.conveyor.y - this.conveyor.displayHeight * 0.3;
            }
        });
    }

    // 在 preload 中确保加载所需资源
    preload() {
        this.load.setBaseURL('assets/');
        
        // 加载背景音乐（确保文件名大小写正确）
        this.load.audio('ecommerce-bgm', 'audio/EcommerceScene.mp3');
        
        // 加载场景基础资源
        this.load.image('ecommerce-bg', 'images/scenes/ecommerce/background.png');  // 背景图
        this.load.image('box-open', 'images/scenes/ecommerce/box-open.png');        // 打开状态的箱子
        this.load.image('box-closed', 'images/scenes/ecommerce/box-closed.png');    // 关闭状态的箱子
        this.load.image('conveyor', 'images/scenes/ecommerce/conveyor.png');      
        this.load.image('red_box', 'images/scenes/ecommerce/red_box.png');  // 打开动画
        this.load.image('yellow_box', 'images/scenes/ecommerce/yellow_box.png');  
        this.load.image('red', 'images/scenes/ecommerce/red.png');  
        this.load.image('yellow', 'images/scenes/ecommerce/yellow.png');  
        // 加载通用资源
        this.load.image('back', 'images/common/back.png');                          // 返回按钮
                        // 按钮背景
        
        // 加载奖牌和完成界面相关资源
        this.load.image('gold', 'images/common/gold.png');
        this.load.image('silver', 'images/common/silver.png');
        this.load.image('bronze', 'images/common/bronze.png');
        this.load.image('try-again-btn', 'images/common/try-again.png');
        this.load.image('other-games-btn', 'images/common/other-games.png');
        this.load.image('reward-bg', 'images/common/reward-bg.png');
        this.load.audio('finish', 'audio/finish.mp3');
        
        // 加载打包音效
        this.load.audio('package-sound', 'audio/package.mp3');
    }

    // 添加一个窗口大小变化的监听器
    resize() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 更新角色位置和大小
        this.player.setPosition(width * 0.10, height * 0.75)
            .setScale(height * 0.001);

        // 更新传送带位置和大小
        if (this.conveyor) {
            this.conveyor.setPosition(this.cameras.main.centerX, this.cameras.main.height * 0.7);
        }

        // 更新箱子位置和大小
        if (this.openBox) {
            this.openBox.setPosition(this.cameras.main.width * 0.7, this.cameras.main.height * 0.3);
        }

        // 更新返回按钮位置
        this.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'back') {
                child.setPosition(this.scale.width * 0.05, this.scale.height * 0.1);
            }
        });
    }

    // 在场景重启或切换时清理动画
    shutdown() {
        if (this.timer) {
            this.timer.remove();
        }
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
        }
        super.shutdown();
    }

    // 修改 resetGameState 方法
    resetGameState() {
        // 重置基本状态
        this.isPlaying = false;
        this.score = 0;
        this.boxCount = 0;        // 已完成的箱子数重置为0
        this.targetBoxCount = 20; // 目标箱子数保持20
        this.gameStartTime = 0;
        this.isPackingAnimating = false;

        // 清理之前的动画
        if (this.timer) {
            this.timer.remove();
        }

        // 清理之前的完成界面元素
        if (this.completionElements) {
            this.completionElements.forEach(element => element.destroy());
            this.completionElements = [];
        }

        // 移除按钮状态重置，将其移到 create 方法中
    }

    // init 方法只重置状态，不涉及 UI
    init() {
        // 只重置游戏状态数据，不涉及UI元素
        this.resetGameState();
    }

    // 场景暂停时处理
    pause() {
        if (this.bgm) {
            this.bgm.pause();
        }
    }

    // 场景恢复时处理
    resume() {
        if (this.bgm && !this.bgm.isPlaying) {
            this.bgm.resume();
        }
    }
}
