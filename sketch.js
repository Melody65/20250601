let video;Add commentMore actions
let handPose;
let hands = [];
let options = {
  flipped: true
};

let items = []; // 儲存所有掉落的蘋果、香蕉、橘子和炸彈的陣列
let itemSize = 20; // 單個物品的大小

let lastItemDropTime = 0;
let itemDropInterval = 500; // 更頻繁地掉落物品，每0.5秒檢查一次

let lastBombDropTime = 0;
let bombDropInterval = 5000; // 炸彈掉落間隔約 5 秒

// --- 籃子變數 ---
let baskets = [];
let basketWidth = itemSize * 3;
let basketHeight = itemSize * 1.5;
let basketSpeed = 3;
let caughtScore = 0; // 改為 caughtScore，因為現在有不同分數的物品

function preload() {
  handPose = ml5.handPose(options);
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, {
    flipped: true
  });
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);

  // 初始化四個籃子
  baskets.push({
    x: width / 5 - basketWidth / 2,
    y: height - basketHeight - 10,
    dir: 1
  });
  baskets.push({
    x: width / 5 * 2 - basketWidth / 2,
    y: height - basketHeight - 10,
    dir: -1
  });
  baskets.push({
    x: width / 5 * 3 - basketWidth / 2,
    y: height - basketHeight - 10,
    dir: 1
  });
  baskets.push({
    x: width / 5 * 4 - basketWidth / 2,
    y: height - basketHeight - 10,
    dir: -1
  });
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);

  // 更新並顯示物品
  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    item.y += item.speed;

    // 檢查是否與籃子碰撞
    let caught = false;
    for (let b of baskets) {
      if (item.x + itemSize / 2 > b.x &&
        item.x - itemSize / 2 < b.x + basketWidth &&
        item.y + itemSize / 2 > b.y &&
        item.y + itemSize / 2 < b.y + basketHeight) {

        if (item.type === 'apple') {
          caughtScore += 1;
        } else if (item.type === 'banana') {
          caughtScore += 2;
        } else if (item.type === 'orange') {
          caughtScore += 3;
        } else if (item.type === 'bomb') {
          caughtScore = 0; // 碰到炸彈分數歸零
        }
        caught = true;
        break; // 物品被接住，停止檢查其他籃子
      }
    }

    if (caught || item.y > height + itemSize) { // 如果被接住或超出畫面
      items.splice(i, 1); // 移除物品
    } else {
      drawItem(item);
    }
  }

  // 更新籃子位置
  for (let b of baskets) {
    b.x += b.dir * basketSpeed;
    if (b.x < 0 || b.x + basketWidth > width) {
      b.dir *= -1;
    }
  }
  drawBaskets();

  // 顯示分數
  fill(255);
  textSize(24);
  textAlign(RIGHT, TOP);
  text('水果: ' + caughtScore, width - 20, 20);

  // 根據手部位置和時間掉落新物品
  if (hands.length > 0) {
    let indexFinger = hands[0].keypoints[8];
    handleItemDrops(indexFinger.x, indexFinger.y);
  }
}

function handleItemDrops(fingerX, fingerY) {
  // 掉落一個普通物品（蘋果、香蕉、橘子）
  if (millis() - lastItemDropTime > itemDropInterval) {
    let itemType = random(['apple', 'banana', 'orange']);
    let newItem;

    // 讓蘋果、香蕉、橘子從手部位置附近掉落
    newItem = {
      x: fingerX + random(-itemSize, itemSize), // 在手指附近隨機X座標
      y: fingerY,
      speed: random(1, 3), // 變化速度
      type: itemType
    };
    items.push(newItem);
    lastItemDropTime = millis();
  }

  // 掉落一個炸彈
  if (millis() - lastBombDropTime > bombDropInterval) {
    let bombX = random(itemSize, width - itemSize); // 隨機X座標
    let newBomb = {
      x: bombX,
      y: -itemSize, // 從畫布上方掉落
      speed: random(2, 4), // 炸彈可以掉落得快一點
      type: 'bomb'
    };
    items.push(newBomb);
    lastBombDropTime = millis();
    bombDropInterval = random(5000, 6000); // 下一個炸彈的間隔為 5-6 秒
  }
}

function drawItem(item) {
  if (item.type === 'apple') {
    drawApple(item.x, item.y);
  } else if (item.type === 'banana') {
    drawBanana(item.x, item.y);
  } else if (item.type === 'orange') {
    drawOrange(item.x, item.y);
  } else if (item.type === 'bomb') {
    drawBomb(item.x, item.y);
  }
}

function drawApple(x, y) {
  noStroke();
  fill(255, 0, 0); // 紅色蘋果
  ellipse(x, y, itemSize, itemSize); // 畫圓形代表蘋果
  // 畫一個小方塊作為蘋果蒂
  fill(139, 69, 19); // 棕色
  rectMode(CENTER);
  rect(x, y - itemSize * 0.3, itemSize * 0.2, itemSize * 0.4);
}

function drawBaskets() {
  for (let b of baskets) {
    // 繪製籃子主體
    fill(139, 69, 19); // 棕色
    rectMode(CORNER);
    rect(b.x, b.y, basketWidth, basketHeight - 10, 5); // 圓角底部

    // 籃子編織紋理
    stroke(101, 51, 0, 150); // 深棕色，半透明
    strokeWeight(1);
    for (let i = 0; i < basketWidth; i += 5) {
      line(b.x + i, b.y, b.x + i, b.y + basketHeight - 10);
    }
    for (let j = 0; j < basketHeight - 10; j += 5) {
      line(b.x, b.y + j, b.x + basketWidth, b.y + j);
    }

    // 籃子邊緣
    noFill();
    stroke(101, 51, 0); // 深棕色邊框
    strokeWeight(2);
    line(b.x, b.y + basketHeight - 10, b.x + basketWidth, b.y + basketHeight - 10);
    line(b.x, b.y + 5, b.x, b.y + basketHeight - 10);
    line(b.x + basketWidth, b.y + 5, b.x + basketWidth, b.y + basketHeight - 10);

    // 籃子提把
    noFill();
    stroke(101, 51, 0);
    strokeWeight(3);
    arc(b.x + basketWidth / 2, b.y + 5, basketWidth * 0.8, basketHeight * 0.8, PI, TWO_PI);
  }
}

function drawBanana(x, y) {
  noStroke();
  fill(255, 255, 0); // 黃色香蕉
  push();
  translate(x, y);
  rotate(PI / 6); // 稍微旋轉，模擬彎曲
  rectMode(CENTER);
  rect(0, 0, itemSize * 1.5, itemSize * 0.5, 5); // 圓角矩形

  // 香蕉頭尾
  fill(0); // 黑色
  ellipse(-itemSize * 0.75, 0, itemSize * 0.2, itemSize * 0.2);
  ellipse(itemSize * 0.75, 0, itemSize * 0.2, itemSize * 0.2);
  pop();
}

function drawOrange(x, y) {
  noStroke();
  fill(255, 165, 0); // 橘色
  ellipse(x, y, itemSize * 1.1, itemSize * 1.1); // 比蘋果大一點的圓形
  // 畫橘子的小莖
  fill(0, 100, 0); // 深綠色
  rect(x - itemSize * 0.1, y - itemSize * 0.5, itemSize * 0.1, itemSize * 0.2);
  // 畫葉子
  ellipse(x + itemSize * 0.1, y - itemSize * 0.4, itemSize * 0.3, itemSize * 0.1);
}


function drawBomb(x, y) {
  noStroke();
  fill(30); // 深灰色或黑色
  ellipse(x, y, itemSize * 1.2, itemSize * 1.2); // 炸彈主體，比水果大一點

  // 炸彈引信
  stroke(150, 75, 0); // 棕色
  strokeWeight(2);
  line(x, y - itemSize * 0.6, x + itemSize * 0.2, y - itemSize * 0.8);

  // 引信尖端 (火花)
  fill(255, 165, 0); // 橘色
  ellipse(x + itemSize * 0.2, y - itemSize * 0.8, itemSize * 0.2, itemSize * 0.2);

  // 炸彈上的小亮點 (反光)
  fill(100); // 淺灰色
  ellipse(x - itemSize * 0.3, y - itemSize * 0.3, itemSize * 0.3, itemSize * 0.3);
}

function gotHands(results) {
  hands = results;
}Add comment
