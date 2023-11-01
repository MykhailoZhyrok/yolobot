import TelegramBot from 'node-telegram-bot-api';

//bot_data
const token = '6641641772:AAELQIvA7wY0uvaSHAVQ5ztm8qpLENyQ1NM';
const bot = new TelegramBot(token, { polling: true });
//adbot_data
const adminToken = '5800101708:AAFU68v7vUxmFO1uDq60CnN0zMrtviJx-Ek';
const adbot = new TelegramBot(adminToken, { polling: true });
const adChatId = 746905113;
const groupChatId = -4010534495;



const cartNumber=4134124314142341


let productData
const googleSheetId = '1ZnSyis84QfgS5a3YOGNmOru2raGk3A7JhDzOHeRSu6k';
const apiKey = 'AIzaSyDEfaVArzzbSWaEobs70pGEW1X5M6qnnfA';
const sheetName = 'sheet1';

const url = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetId}/values/${sheetName}?key=${apiKey}`;

async function getDataAndTransform() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        productData = transformJsonToProductData(data); 
         
    } catch (error) {
        console.error('Произошла ошибка при получении данных:', error);
    }
}

function transformJsonToProductData(jsonData) {
    const values = jsonData.values;
    const productData = values.map(row => {
        const [name, price] = row;
        const nameParts = name.split(' ');
        return {
            name: `yolo: ${nameParts[0]} ${nameParts[1]}`,
            price: price,
            components: parseInt(nameParts[1])
        };
    });
    return productData;
}

getDataAndTransform()
  .then(() => {
   
    function newProductButtons() {
        
        
        const buttons = productData.map((product) => {
            const callbackData = `${product.name}`;
            return [{ text: `${product.name} ${product.price}`, callback_data: callbackData }];
        });
        return {
            reply_markup: { inline_keyboard: buttons }
        };
    }
    
    function cartButtons(chatId) {
        if (!userCarts[chatId]) {
            return { reply_markup: { inline_keyboard: [] } };
        }
    
        const cart = userCarts[chatId];
    
        const buttons = Object.keys(cart).map((selectedProduct) => {
            const quantity = cart[selectedProduct];
            const callbackData = `add_${selectedProduct}`;
            return [{ text: `${selectedProduct}: ${quantity}`, callback_data: callbackData }];
        });
    
        buttons.push([{ text: "Готово", callback_data: `readyEdit` }]);
    
        return { reply_markup: { inline_keyboard: buttons } };
    }
    bot.setMyCommands([
        { command: '/start', description: 'Початкове вітання' }])
    
    function cartOptions() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Редагувати кошик', callback_data: 'editCart' },
                    { text: 'Очистити кошик', callback_data: 'clearCart' }],
                    [{ text: 'Замовити', callback_data: 'orderCart' }]]
            }
        }
    }
    function getPriceByName(productId) {
        const product = productData.find(product => product.name === productId);
        return product ? product.price : 'Товар відсутній';
    }
    function getProductByName(productId) {
        const product = productData.find(product => product.name === productId);
        return product ? product.name : 'Товар відсутній';
    }
    
    function getMainMenu() {
        return {
            reply_markup: {
                keyboard: [
                    ['Кошик', 'Обрати смак'],
                    ['Відгук', 'Ваші дані']
                ],
                resize_keyboard: true
            }
        };
    }
    const createInfo = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Надати контактну інформацію', callback_data: 'createInfo' }]]
        }
    }
    
    const redactInfo = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Змінити контактну інформацію', callback_data: 'createInfo' }]]
        }
    }
    const acceptInfo = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Підтвердити', callback_data: 'nextStepPay' }]]
        }
    }
    
    const wayPay = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Повна предоплата(не враховуючи доставку)', callback_data: 'payNow' }],
                [{ text: 'Оплата при отриманні', callback_data: 'payLater' }]]
        }
    }
    
    const orderNumbers = {};
    
    function generateRandomOrderNumber(chatId) {
        const randomNumber = Math.floor(Math.random() * 90000) + 10000;
        const orderNumber = `#${randomNumber}`;  
        orderNumbers[chatId] = orderNumber;
      
        return orderNumber;
      }
    
    const userSelections = {};
    const userCarts = {};
    const userInfo = {};
    const photo = {}
    
    bot.on('message', async (msg, match) => {
        const text = msg.text;
        const chatId = msg.chat.id;
        const messageId = msg.id
    
        if (text === '/start') {
            await bot.sendMessage(chatId, `Ласкаво просимо до нашого телеграм боту`, getMainMenu())
        }
    
        if (text === 'Кошик') {
            await getDataAndTransform();
            const cart = userCarts[chatId];
            if (cart && Object.keys(cart).length !== 0) {
                let cartText = 'Ваш кошик:\n';
                let totalSum = 0;
                for (const productId in cart) {
                    const productPrice = getPriceByName(productId);
                    const productName = getProductByName(productId);
                    const quantity = cart[productId];
                    const cleanedProductPrice = parseFloat(productPrice.replace('грн.', ''));
                    const sumProd = quantity * cleanedProductPrice;
                    cartText += `${productName}: ${quantity} | ${sumProd}грн. \n`;
                    totalSum += sumProd;
                }
                cartText += `Загальна сума: ${totalSum}грн. \n`;
                bot.sendMessage(chatId, cartText, cartOptions());
    
            } else {
                bot.sendMessage(chatId, 'Ваш кошик порожній.');
            }
        }
        if (text === 'Обрати смак') {
            await getDataAndTransform();
            if (!userSelections[chatId]) {
                userSelections[chatId] = { selectedProduct: null, quantity: 0 };
            }
            bot.sendMessage(chatId, 'Оберіть смак:', newProductButtons(userSelections[chatId].quantity));
        }
        if (text === 'Відгук') {
            await bot.sendMessage(chatId, 'Будь ласка, напишіть ваш відгук. Відправте його, коли закінчите.')
            bot.once('text', (feedbackMsg) => {
                const feedbackText = feedbackMsg.text;
    
    
                adbot.sendMessage(adChatId, `Відгук від користувача ${msg.from.username}:\n${feedbackText}`)
                bot.sendMessage(chatId, 'Дякуємо за ваш відгук!');
    
            });
        }
        if (text === 'Ваші дані') {
            if (userInfo[chatId]) {
                const { name, phoneNumber, cityPost } = userInfo[chatId];
                const message = `Ваша інформація:
    
    Прізвище та ім'я: ${name}
    Номер телефону: ${phoneNumber}
    Місто та номер відділення Нової Пошти: ${cityPost}`;
                bot.sendMessage(chatId, message, redactInfo);
            } else {
                bot.sendMessage(chatId, 'Інформація про користувача не знайдена.', createInfo);
            }
        }//Продовженяя отримання контактів
        if (userInfo[chatId]) {
            if (userInfo[chatId].status === 'awaitingName') {
                userInfo[chatId].name = text;
                userInfo[chatId].status = 'awaitingPhoneNumber';
             
                bot.sendMessage(chatId, 'Введіть свій номер телефону:');
            } else if (userInfo[chatId].status === 'awaitingPhoneNumber') {
                userInfo[chatId].phoneNumber = text;
                userInfo[chatId].status = 'awaitingCityPost';
           
                bot.sendMessage(chatId, 'Введіть назву міста та номер відділення Нової Пошти:');
            } else if (userInfo[chatId].status === 'awaitingCityPost' && userInfo[chatId].topay === 'goToPay') {
                userInfo[chatId].cityPost = text;
                userInfo[chatId].status = 0;
                const { name, phoneNumber, cityPost } = userInfo[chatId];
                const message = `Ваша інформація:
    
    Прізвище та ім'я: ${name}
    Номер телефону: ${phoneNumber}
    Місто та номер відділення Нової Пошти: ${cityPost}`;
                bot.sendMessage(chatId, message, acceptInfo);
            }
            else if (userInfo[chatId].status === 'awaitingCityPost') {
                userInfo[chatId].cityPost = text;
                userInfo[chatId].status = 0;
                const { name, phoneNumber, cityPost } = userInfo[chatId];
                const message = `Ваша інформація:
    
    Прізвище та ім'я: ${name}
    Номер телефону: ${phoneNumber}
    Місто та номер відділення Нової Пошти: ${cityPost}`;
                bot.sendMessage(chatId, message, redactInfo);
            }
    
    
        }
    
    
    })
    
    
    
    bot.on('photo', (msg) => {
      const chatId = msg.chat.id;
      const photoId = msg.photo[0].file_id;
    
     if(userInfo[chatId]){if(userInfo[chatId].status='awaitingPhoto') {bot.sendPhoto(groupChatId, photoId, { caption: `chatID${chatId}, Номер замовлення: ${orderNumbers[chatId]}` }).then(() => {
          const userMessage = 'Фотографію відправлено адміністратору для перевірки.';
          bot.sendMessage(chatId, userMessage);
        })
        .catch((error) => {
          console.error('Помилка при відправці фотографії адміну:', error);
        }); ;}
    }
    });
    
    
    
    bot.on('callback_query', (query) => {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        const data = query.data;
        const text = query.message.text;
        if (data.startsWith('yolo')) {
            const selectedProduct = data.replace('yolo_', '');
            userSelections[chatId].selectedProduct = selectedProduct;
            bot.editMessageText(`Оберіть кількість ${userSelections[chatId].selectedProduct}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[
                        { text: `<=`, callback_data: 'back' },
                        { text: `${userSelections[chatId].quantity}`, callback_data: 'quantity' },
                        { text: `=>`, callback_data: 'next' }
                    ], [
                        { text: 'Додати в кошик', callback_data: 'addBasket' },
                        { text: 'Назад', callback_data: 'backToProduct' }
                    ]]
                }
            });
        }
    
        else if (data === 'next') {
            userSelections[chatId].quantity += 1;
    
            bot.editMessageText(`Оберіть кількість ${userSelections[chatId].selectedProduct}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[
                        { text: `<=`, callback_data: 'back' },
                        { text: `${userSelections[chatId].quantity}`, callback_data: 'quantity' },
                        { text: `=>`, callback_data: 'next' }
                    ], [
                        { text: 'Додати в кошик', callback_data: 'addBasket' },
                        { text: 'Назад', callback_data: 'backToProduct' }
                    ]]
                }
            });
        } else if (data === 'back' && userSelections[chatId].quantity >= 1) {
            userSelections[chatId].quantity -= 1;
    
            bot.editMessageText(`Оберіть кількість ${userSelections[chatId].selectedProduct}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[
                        { text: `<=`, callback_data: 'back' },
                        { text: `${userSelections[chatId].quantity}`, callback_data: 'quantity' },
                        { text: `=>`, callback_data: 'next' }
                    ], [
                        { text: 'Додати в кошик', callback_data: 'addBasket' },
                        { text: 'Назад', callback_data: 'backToProduct' }
                    ]]
                }
            });
        }
        else if (data === 'addBasket') {
            const selectedProduct = userSelections[chatId].selectedProduct;
    
            if (!userCarts[chatId]) {
                userCarts[chatId] = {};
            }
    
            const cart = userCarts[chatId];
            if (userSelections[chatId].quantity !== 0) {
                cart[selectedProduct] = (cart[selectedProduct] || 0) + userSelections[chatId].quantity;
                bot.deleteMessage(chatId, messageId).then(() => {
                    bot.sendMessage(chatId, `Продукт "${selectedProduct}" додано в кошик. Оберіть інший смак:`, newProductButtons(userSelections[chatId].quantity));
                }).catch((error) => {
                    console.error('Помилка при видаленні повідомлення:', error);
                });
            }
    
            // Скидання кількості
            userSelections[chatId].quantity = 0;
            bot.deleteMessage(chatId, messageId).then(() => {
                bot.sendMessage(chatId, `Оберіть інший смак:`, newProductButtons(userSelections[chatId].quantity));
            }).catch((error) => {
                console.error('Помилка при видаленні повідомлення:', error);
            });
        } else if (data === 'backToProduct') {
            userSelections[chatId].selectedProduct = 0;
    
            bot.deleteMessage(chatId, messageId).then(() => {
    
                bot.sendMessage(chatId, 'Оберіть смак:', newProductButtons(userSelections[chatId].quantity));
            }).catch((error) => {
                console.error('Помилка при видаленні повідомлення:', error);
            });
        }
        else if (data === 'clearCart') {
            userCarts[chatId] = {};
            bot.deleteMessage(chatId, messageId).then(() => {
    
                bot.sendMessage(chatId, 'Ваш кошик порожній.')
            }).catch((error) => {
                console.error('Помилка при видаленні повідомлення:', error);
            });
    
    
        }
        else if (data === 'editCart') {
    
            bot.editMessageText(`Оберіть товар, який слід змінити`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup:
                    cartButtons(chatId).reply_markup
    
            });
        }
        else if (data.startsWith('add_yolo')) {
            const cart = userCarts[chatId];
            
            const selectedProduct = data.replace('add_', '');
            const initialQuantity = cart[selectedProduct] || 0;  
            // Default to 0 if not found
        userSelections[chatId].quantity = initialQuantity;
    
        
            userSelections[chatId].selectedProduct = selectedProduct;
            bot.deleteMessage(chatId, messageId).then(() => {
                bot.sendMessage(chatId, `Оберіть кількість ${userSelections[chatId].selectedProduct}`, {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: `<=`, callback_data: 'backCount' },
                            { text: `${userSelections[chatId].quantity}`, callback_data: 'quantity' },
                            { text: `=>`, callback_data: 'nextCount' }
                        ], [
                            { text: 'Змінити', callback_data: 'changeQuant' },
                            { text: 'Назад', callback_data: 'editCart' }
                        ]]
                    }
                });
            }).catch((error) => {
                console.error('Помилка при видаленні повідомлення:', error);
            });
    
        }
        else if (data === 'changeQuant') {
            const selectedProduct = userSelections[chatId].selectedProduct;
            const selectedQuantity = userSelections[chatId].quantity;
    
            const cart = userCarts[chatId];
    
            if (cart && cart[selectedProduct]) {
                delete cart[selectedProduct];
            }
    
            if (selectedQuantity > 0) {
                cart[selectedProduct] = selectedQuantity;
            }
    
            userSelections[chatId].quantity = 0;
    
            bot.editMessageText('Ваш кошик:', {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: cartButtons(chatId).reply_markup
            });
        }
        else if (data === 'nextCount') {
            userSelections[chatId].quantity += 1;
    
            bot.editMessageText(`Оберіть кількість ${userSelections[chatId].selectedProduct}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[
                        { text: `<=`, callback_data: 'backCount' },
                        { text: `${userSelections[chatId].quantity}`, callback_data: 'quantity' },
                        { text: `=>`, callback_data: 'nextCount' }
                    ], [
                        { text: 'Змінити', callback_data: 'changeQuant' },
                        { text: 'Назад', callback_data: 'editCart' }
                    ]]
                }
            });
        }  
    
        else if (data === 'backCount' && userSelections[chatId].quantity > 0) {
            userSelections[chatId].quantity -= 1;
            bot.editMessageText(`Оберіть кількість ${userSelections[chatId].selectedProduct}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[
                        { text: `<=`, callback_data: 'backCount' },
                        { text: `${userSelections[chatId].quantity}`, callback_data: 'quantity' },
                        { text: `=>`, callback_data: 'nextCount' }
                    ], [
                        { text: 'Змінити', callback_data: 'changeQuant' },
                        { text: 'Назад', callback_data: 'editCart' }
                    ]]
                }
            });
        }
        else if(data==='quantity'){
            bot.answerCallbackQuery({
                callback_query_id: query.id,
                text: 'Ця кнопка не працює',
                show_alert: true,})
            
        }
        else if (data === 'readyEdit') {
    
            const cart = userCarts[chatId];
           
            bot.deleteMessage(chatId, messageId).then(() => {
                if (cart && Object.keys(cart).length !== 0) {
                    let cartText = 'Ваш кошик:\n';
                    let totalSum = 0;
                    for (const productId in cart) {
                        const productPrice = getPriceByName(productId);
                        const productName = getProductByName(productId);
                        const quantity = cart[productId];
                        const cleanedProductPrice = parseFloat(productPrice.replace('грн.', ''));
                        const sumProd = quantity * cleanedProductPrice;
                        cartText += `${productName}: ${quantity} | ${sumProd}грн. \n`;
                        totalSum += sumProd;
                    }
                    cartText += `Загальна сума: ${totalSum}грн. \n`;
                    bot.sendMessage(chatId, cartText, cartOptions());
    
                } else {
                    bot.sendMessage(chatId, 'Ваш кошик порожній.');
                }
            }).catch((error) => {
                console.error('Помилка при видаленні повідомлення:', error);
            });
        }//Логіка отримання даних
        else if (data === 'createInfo') {
            userInfo[chatId] = {};
    
            userInfo[chatId].status = 'awaitingName';
            
            bot.sendMessage(chatId, 'Введіть прізвище та ім\'я:');
        }
        else if (data === 'orderCart') {
            if (userInfo[chatId]) {
                const { name, phoneNumber, cityPost } = userInfo[chatId];
                const message = `Ваша інформація:
    
    Прізвище та ім'я: ${name}
    Номер телефону: ${phoneNumber}
    Місто та номер відділення Нової Пошти: ${cityPost}`;
                bot.editMessageText(message, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: acceptInfo.reply_markup
                });
    
            } else {
                userInfo[chatId] = {};
                userInfo[chatId].topay = 'goToPay';
                userInfo[chatId].status = 'awaitingName';
                
                bot.sendMessage(chatId, 'Введіть прізвище та ім\'я:')
            }
        }
        else if (data === 'nextStepPay') {
            const cart = userCarts[chatId];
         
            let cartText = 'Ваш замовлення:\n';
            let totalSum = 0;
            for (const productId in cart) {
                const productPrice = getPriceByName(productId);
                const productName = getProductByName(productId);
                const quantity = cart[productId];
                const cleanedProductPrice = parseFloat(productPrice.replace('грн.', ''));
                const sumProd = quantity * cleanedProductPrice;
                cartText += `${productName}: ${quantity} | ${sumProd}грн. \n`;
                totalSum += sumProd;
            }
            cartText += `Загальна сума: ${totalSum}грн. \n`;
          
            console.log(chatId)
            bot.deleteMessage(chatId, messageId).then(() => {
                bot.sendMessage(chatId, `${cartText}
    Оберіть спосіб оплати:`, wayPay)
            }).catch((error) => {
                console.error('Помилка при видаленні повідомлення:', error);
            });
            
        }
        else if(data==='payLater'){
            const orderNumber = generateRandomOrderNumber(chatId);
            const cart = userCarts[chatId];
            
            let cartText = 'Замовлення:\n';
            let totalSum = 0;
            for (const productId in cart) {
                const productPrice = getPriceByName(productId);
                const productName = getProductByName(productId);
                const quantity = cart[productId];
                const cleanedProductPrice = parseFloat(productPrice.replace('грн.', ''));
                const sumProd = quantity * cleanedProductPrice;
                cartText += `${productName}: ${quantity} | ${sumProd}грн. \n`;
                totalSum += sumProd;
            }
            cartText += `Загальна сума: ${totalSum}грн. \n`;
    
            bot.deleteMessage(chatId, messageId).then(() => {
                bot.sendMessage(chatId, `${cartText}
    Ваш номер замовлення: ${orderNumber}
    Дякуємо за замовлення!`)
            }).catch((error) => {
                console.error('Помилка при видаленні повідомлення:', error);
            });
    
    
            if (userInfo[chatId]) {
                const { name, phoneNumber, cityPost } = userInfo[chatId];
                const message = `
    ChatId:${chatId}
    Прізвище та ім'я: ${name}
    Номер телефону: ${phoneNumber}
    Місто та номер відділення Нової Пошти: ${cityPost}`;
    adbot.sendMessage(adChatId, `${message}${cartText}
    Номер замовлення: ${orderNumber}`, agreeSell)}
            
        }
        else if(data==='payNow'){
            const orderNumber = generateRandomOrderNumber(chatId);
            userInfo[chatId].status = 'awaitingPhoto'
            const cart = userCarts[chatId];
            
            let cartText = 'Ваш замовлення:\n';
            let totalSum = 0;
            for (const productId in cart) {
                const productPrice = getPriceByName(productId);
                const productName = getProductByName(productId);
                const quantity = cart[productId];
                const cleanedProductPrice = parseFloat(productPrice.replace('грн.', ''));
                const sumProd = quantity * cleanedProductPrice;
                cartText += `${productName}: ${quantity} | ${sumProd}грн. \n`;
                totalSum += sumProd;
            }
            
            
            cartText += `Загальна сума: ${totalSum}грн. \n`;
            
            console.log(chatId)
            bot.deleteMessage(chatId, messageId).then(() => {
                bot.sendMessage(chatId, `
    Номер замовлення: ${orderNumber}
    ${totalSum} Номер карти для оплати(ПІБ):
    ${cartNumber}
    ❗️Після оплати, будь ласка, надішліть боту скріншот з підтвердженням оплати
    `)
            }).catch((error) => {
                console.error('Помилка при видаленні повідомлення:', error);
            });
            if (userInfo[chatId]) {
                const { name, phoneNumber, cityPost } = userInfo[chatId];
                const message =`
    ChatId:${chatId}
    Прізвище та ім'я: ${name}
    Номер телефону: ${phoneNumber}
    Місто та номер відділення Нової Пошти: ${cityPost}`;
    adbot.sendMessage(adChatId, `${message}${cartText}
    Номер замовлення: ${orderNumber}`, agreeSell)}
    
    
        }
    });
    
    
    //AdminBot
    
    const adminState = {};
    const agreeSell = {
        reply_markup: {
            keyboard: [
                [{ text: 'Підтвердити', callback_data: 'confirm_order' }],]
        }
    }
    adbot.setMyCommands([
        { command: '/start', description: 'Початкове вітання' },
    ]);
    
   
    
    adbot.on('message', async (msg, match) => {
        const text = msg.text;
        const chatId = msg.chat.id;
    
        if (text === '/start') {
            adbot.sendMessage(adChatId, `Бот працює`, agreeSell);
        } else if (text === '/add_product') {
            adbot.sendMessage(adChatId, 'Напишіть назву смаку');
            adbot.once('text', (feedbackMsg) => {
                const feedbackText = feedbackMsg.text;
                adbot.sendMessage(adChatId, `Товар додано:\n${feedbackText}`);
            });
        }
        else if (text === 'Підтвердити') {
            // Переконайтеся, що chatId та messageId вже визначені
            const chatId = msg.chat.id;
            const messageId = msg.message_id;
        
            // Встановіть статус inputID
            adminState[chatId] = { status: 'inputID' };
        
            // Видаліть повідомлення від користувача
            adbot.deleteMessage(chatId, messageId).then(() => {
                // Надішліть запит користувачу
                adbot.sendMessage(adChatId, 'Введіть ID, який підтвердити:');
            }).catch((error) => {
                console.error('Помилка при видаленні повідомлення:', error);
                // Обробка помилки при видаленні повідомлення
                const errorMessage = 'Помилка при видаленні повідомлення. Спробуйте ще раз пізніше.';
                bot.sendMessage(chatId, errorMessage);
            });
        }
        
         else if (adminState[chatId]?.status === 'inputID') {
            // Отримайте ID, який ви хочете підтвердити
            const acceptedId = text;
    
            // Відправте підтвердження користувачу
            const confirmationMessage = 'Ваше замовлення підтверджено. Найближчим часом буде відправка.';
            bot.sendMessage(acceptedId, confirmationMessage);
            userCarts[acceptedId]={};
            // Скиньте статус адмінського чату до "inputID"
            adminState[chatId].status = 0;
    
            // Очистіть статус після виконання
            delete adminState[chatId];
    
            // Відправте повідомлення адміну про підтвердження
            adbot.sendMessage(adChatId, `Підтверджено замовлення користувача ID: ${acceptedId}`);
        }
    });
    
    


    
    console.log(productData);
    // Вы можете выполнять другие действия с данными
  })
  .catch(error => {
    // Обработка ошибки, если таковая возникла
  });

