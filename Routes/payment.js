const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");

router.post("/order", async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: "rzp_test_QwVFufHZbexRin",
            key_secret: "mkq6sWa8gQfjlExYYrIJgXB1",
        });

        const options = {
            amount: req.body.amount * 100,
            currency: "INR",
            receipt: crypto.randomBytes(10).toString("hex"),
        };

        instance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Something Went Wrong" });
            }
            res.status(200).json({ data: order });
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/verify", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSign = crypto
            .createHmac("sha256", "mkq6sWa8gQfjlExYYrIJgXB1")
            .update(sign.toString())
            .digest("hex");

        if (expectedSign !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        } else {
            return res.status(200).json({ message: "Payment verified successfully" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
