var capital = require("./capital.js");
var async = require('async');
var slackToken = "xoxb-267111720244-y8buNECTAQMNJox8f6zrRF4M";
var slack = require("./slack.js");
var Botkit = require('botkit');
var Table = require('cli-table');
var couponsdb = require('./coupondb.json')
var coupons = couponsdb.data;
var controller = Botkit.slackbot({
    debug: false
        //include "log: false" to disable logging
        //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});
controller.spawn({
    // token: process.env.SLACKTOKEN
    token: slackToken
}).startRTM()
var count = 0
var target = 10;
var started = false;
var username = null;
var categorySet = new Set();
var finalcoupons = []

function getRandom() {
    return Math.random() * (100 - 1) + 1;
}
var ids = ['59fe647cb390353c953a1e81', '59fe64a6b390353c953a1e83', '59fe64beb390353c953a1e84', '59fe64d3b390353c953a1e85'];
var names = ['Vikas Pandey', 'Shubham Munot', 'Harsha Reddy', 'Rishi Jain'];



controller.hears('hi', 'direct_mention,direct_message', function(bot, message) {
    started = true;
    userName = message.user;
    // slackUser.getName(message.user, function(name) {
    //     if (name) {
    //         userName = name;

    //     }
    // });
    slack.getFullName(userName, function(fullName) {
        if (fullName != null) {
            var firstlast = fullName.split(" ");
            var firstName = firstlast[0];
            var lastName = firstlast[1];
            var senderCustomerID = null
                // var recieverCustomerID = null
            capital.getCustomerID(firstName, lastName, function(customerId) {
                if (customerId != null) {

                    senderCustomerID = customerId;
                }

                bot.startConversation(message, function(err, convo) {
                    bot.reply(message, 'Hi' + '<@' + message.user + '>..Let\'s get started \n Type exit at any moment to quit the chat.');
                    convo.addQuestion("Generate Transactions", function(answer, convo) {
                        bot.reply(message, "Dine");
                        var merchants = []
                        capital.getAccountID(senderCustomerID, "Credit Card", function(accid) {
                            if (accid != null) {
                                senderAccountID = accid;

                                capital.getAllMerchants(function(body) {
                                    body = JSON.parse(body)
                                    for (i = 0; i < body.data.length; i++) {
                                        merchants.push(body.data[i]._id);
                                    }
                                    for (i = 0; i < 10; i++) {
                                        pos = Math.floor(Math.random() * merchants.length);
                                        val = getRandom()
                                        ceil = Math.ceil(val)
                                        save = ceil - val
                                        body = {
                                            "merchant_id": merchants[pos],
                                            "medium": "balance",
                                            // "purchase_date": "2017-11-05",
                                            "amount": ceil
                                        }
                                        capital.makePurchase(senderAccountID, body, function(body) {
                                            capital.getAccountID(senderCustomerID, "Savings", function(saveID) {
                                                capital.deposit(saveID, { medium: "balance", amount: save }, function(body) {
                                                    console.log(body)
                                                })
                                            })
                                        })
                                    }
                                    capital.getAccountID(senderCustomerID, "Savings", function(saveID) {
                                        capital.getAccountByAccountId(saveID, function(body) {
                                            // body = JSON.parse(body)
                                            if (body.balance >= target) {
                                                slack.getAllUserNames(function(users) {
                                                    for (k = 0; k < users.length; k++) {
                                                        if (users[k] != message.user) {
                                                            bot.say({
                                                                text: fullName + " has reached the saving target",
                                                                channel: users[k]
                                                            })
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    })
                                    convo.next();
                                })
                            }


                        })
                    })
                    convo.on('end', function(convo) {
                        if (convo.status == "completed") {
                            bot.reply(message, "You can send money, get account summary or ask about savings circle");
                            convo.stop();
                        }
                    })


                })
            })
        }
    })
});


controller.hears('Send money', 'direct_mention,direct_message', function(bot, message) {
    started = true;
    userName = message.user;
    // slackUser.getName(message.user, function(name) {
    //     if (name) {
    //         userName = name;

    //     }
    // });

    slack.getFullName(userName, function(fullName) {
        if (fullName != null) {
            var firstlast = fullName.split(" ");
            var firstNameSender = firstlast[0];
            var lastNameSender = firstlast[1];
            var senderCustomerID = null
            var recieverCustomerID = null
            capital.getCustomerID(firstNameSender, lastNameSender, function(customerId) {
                if (customerId != null) {
                    senderCustomerID = customerId;
                }
                bot.startConversation(message, function(err, convo) {
                    convo.next();
                    convo.addQuestion("Whom would you like to send money? Please enter full name", function(answer, convo) {
                        var recipient = answer.text;

                        var firstlastReceiver = recipient.split(" ");

                        capital.getCustomerID(firstlastReceiver[0], firstlastReceiver[1], function(customerIdReceiver) {
                            if (customerIdReceiver != null) {
                                recieverCustomerID = customerIdReceiver;
                                console.log("shu");
                                convo.next();
                                convo.addQuestion("How much yould you like to send? ", function(answer, convo) {
                                    var sendMoney = answer.text;
                                    var senderAccountID = null;
                                    var receiverAccountID = null;
                                    capital.getAccountID(senderCustomerID, "Checking", function(accid) {
                                        if (accid != null) {
                                            senderAccountID = accid;
                                            capital.getAccountID(recieverCustomerID, "Checking", function(accidd) {
                                                if (accidd != null) {
                                                    receiverAccountID = accidd;
                                                    var options = {
                                                        "medium": "balance",
                                                        "payee_id": receiverAccountID,
                                                        "amount": parseFloat(sendMoney),
                                                    };
                                                    capital.createTransfer(senderAccountID, options, function(response) {

                                                        if (response.code == 201) {
                                                            bot.reply(message, " You have successfully sent " + sendMoney + "$ to " + recipient);
                                                        } else {
                                                            bot.reply(message, "Transaction failed. Try again.");
                                                        }
                                                        convo.next();
                                                    })
                                                }

                                            })
                                        }
                                    })

                                })

                            }
                        })

                    })
                    convo.on('end', function(convo) {
                        if (convo.status == "completed") {
                            bot.reply(message, "End of Tranfer");
                            convo.stop();
                        }
                    })
                });

            })
        }
    })



});

controller.hears('Give account summary', 'direct_mention,direct_message', function(bot, message) {
    started = true;
    userName = message.user;
    // slackUser.getName(message.user, function(name) {
    //     if (name) {
    //         userName = name;

    //     }
    // });

    slack.getFullName(userName, function(fullName) {
        if (fullName != null) {
            var firstlast = fullName.split(" ");
            var firstNameSender = firstlast[0];
            var lastNameSender = firstlast[1];
            var senderCustomerID = null
            capital.getCustomerID(firstNameSender, lastNameSender, function(customerId) {
                if (customerId != null) {

                    senderCustomerID = customerId;
                }
                capital.getAccount(senderCustomerID, function(acc_details) {
                    bot.startConversation(message, function(err, convo) {
                        console.log(acc_details);
                        bot.reply(message, "Account Number: \tType: \tBalance ");



                        // instantiate 
                        var table = new Table({
                            head: ['Account Number', 'Type', 'Balance'],
                            colWidths: [100, 200]
                        });



                        async.eachSeries(acc_details, function(acc, callback) {
                            //console.log(expert);
                            table.push(acc_details[i].account_number, acc_details[i].type, acc_details[i].balance, function() {
                                callback();
                            });
                            // Alternatively: callback(new Error());
                        }, function(callback) {
                            console.log(table);
                            bot.reply(message, table);
                        })
                        convo.on('end', function(convo) {
                            if (convo.status == "completed") {
                                bot.reply(message, "-----------");
                                convo.stop();
                            }
                        })
                    })
                })
            })
        }
    })

});



controller.hears('What about my Savings Circle?', 'direct_mention,direct_message', function(bot, message) {
    userName = message.user;
    bot.startConversation(message, function(err, convo) {
        var savingDetails = [];
        var i = 0;
        async.eachSeries(ids, function(id_each, callback) {
            capital.getAccountID(id_each, "Savings", function(acc_id) {
                capital.getAccountByAccountId(acc_id, function(response) {
                    bot.reply(message, names[i++] + " : " + response.balance, function() {
                        callback();
                    });

                })

            })
        }, function(callback) {
            bot.reply(message, "Spend more.. Save more..!!)");
            convo.stop();
        })
    });
});




// controller.hears('recommend coupons', 'direct_mention,direct_message', function(bot, message) {
//     userName = message.user;
//     // slackUser.getName(message.user, function(name) {
//     //     if (name) {
//     //         userName = name;

//     //     }
//     // });
//     slack.getFullName(userName, function(fullName) {
//         if (fullName != null) {
//             var firstlast = fullName.split(" ");
//             var firstName = firstlast[0];
//             var lastName = firstlast[1];
//             var senderCustomerID = null
//                 // var recieverCustomerID = null
//             capital.getCustomerID(firstName, lastName, function(customerId) {
//                 if (customerId != null) {

//                     senderCustomerID = customerId;
//                 }

//                 bot.startConversation(message, function(err, convo) {
//                     capital.getAccountID(senderCustomerID, "Credit Card", function(accid) {
//                             if (accid != null) {
//                                 senderAccountID = accid;

//                                 capital.getAllPurchasesByAccountID(accid, function(body) {
//                                     body = JSON.parse(body)
//                                     merchants = []

//                                     for (k = 0; k < 10; k++) {
//                                         // async.each(body, function(item, callback) {
//                                         // if (count == 3) {
//                                         //     callback(err)
//                                         // }
//                                         // merchants.push(body[i].merchant_id)
//                                         outer(body, k, count, function() {
//                                             convo.next;
//                                         })
//                                     }

//                                     // if (categorySet.size > 2) {
//                                     //     console.log(categorySet);
//                                     //     categories = Array.from(categorySet);
//                                     //     for (m = 0; m < 3; m++) {
//                                     //         var cat = categories[Math.floor(Math.random() * categories.length)];
//                                     //         coupons = couponsdb.data;
//                                     //         for (n = 0; n < coupons.length; n++) {
//                                     //             couponCat = coupons[i].category
//                                     //             for (l = 0; l < couponCat.length; l++) {
//                                     //                 if (couponCat[l] == cat) {
//                                     //                     bot.reply(message, `You got a coupon from ${coupons[i].merchant_name} for a discount of ${coupons[i].discount}%`)
//                                     //                     n = coupons.length
//                                     //                     break;
//                                     //                 }
//                                     //             }

//                                     //         }
//                                     //     }
//                                     // }

//                                 })

//                             }



//                         })
//                         // convo.next();
//                     convo.on('end', function(convo) {
//                         if (convo.status == "completed") {
//                             // bot.reply(message, "End of test");
//                             for (i = 0; i < 3; i++) {
//                                 bot.reply(message, finalcoupons[i])
//                             }
//                             convo.stop();
//                         }
//                     })


//                 })
//             })
//         }
//     })
// });

// function inner(cat, coupons, n) {
//     couponCat = coupons[n].category[0]
//         // for (l = 0; l < couponCat.length; l++) {
//     if (couponCat == cat) {
//         finalcoupons.push(`You got a coupon from ${coupons[n].merchant_name} for a discount of ${coupons[n].discount}%`);
//         // count += 1;
//         // if (count == 3) {
//         //     // convo.stop();
//         //     // callback(err);
//         //     // break;
//         //     convo.next();
//         // }
//         // // callback();
//         // break;
//     }
// }

// function outer(body, k, callback) {
//     capital.getMerchant(body[k].merchant_id, function(merchantData) {
//         merchantData = JSON.parse(merchantData)
//         var cat = merchantData.category[0]
//         for (n = 0; n < coupons.length; n++) {
//             // couponCat = coupons[n].category[0]
//             //     // for (l = 0; l < couponCat.length; l++) {
//             // if (couponCat == cat) {
//             //     finalcoupons.push(`You got a coupon from ${coupons[n].merchant_name} for a discount of ${coupons[n].discount}%`);
//             //     count += 1;
//             //     if (count == 3) {
//             //         // convo.stop();
//             //         // callback(err);
//             //         // break;
//             //         convo.next();
//             //     }
//             //     // callback();
//             //     break;
//             // }
//             inner(cat, coupons, n)
//         }
//         // convo.next();

//     });
//     callback()
// }