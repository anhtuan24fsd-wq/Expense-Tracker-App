import pool from "../libs/database.js";

// Hàm lấy danh sách tài khoản của người dùng
export const getAccounts = async (req, res) => {
  try {
    // Lấy userId từ thông tin user đã được xác thực
    const { userId } = req.user;

    // Truy vấn database để lấy tất cả tài khoản của user
    const accounts = await pool.query(
      "SELECT * FROM tblaccount WHERE user_id = $1",
      [userId]
    );

    // Trả về danh sách tài khoản thành công
    res.status(200).json({ status: true, data: accounts.rows });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm tạo tài khoản mới cho người dùng
export const createAccount = async (req, res) => {
  try {
    // Lấy userId từ thông tin user đã được xác thực
    const { userId } = req.user;

    // Lấy thông tin tài khoản từ request body
    const { name, amount, account_number } = req.body;

    // Kiểm tra xem tài khoản với tên này đã tồn tại chưa
    const accountExistResult = await pool.query(
      "SELECT * FROM tblaccount WHERE account_name = $1 AND user_id = $2",
      [name, userId]
    );
    const accountsExist = accountExistResult.rows[0];

    // Nếu tài khoản đã tồn tại, trả về lỗi 409 (Conflict)
    if (accountsExist) {
      return res
        .status(409)
        .json({ status: false, message: "Tài khoản đã tồn tại" });
    }

    // Tạo tài khoản mới trong database
    const createAccountResult = await pool.query(
      "INSERT INTO tblaccount (user_id, account_name, account_number, account_balance) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, name, account_number, amount]
    );
    const account = createAccountResult.rows[0];

    // Chuyển đổi tên tài khoản thành mảng (nếu chưa phải mảng)
    const userAccounts = Array.isArray(name) ? name : [name];

    // Cập nhật danh sách tài khoản của user trong bảng tbluser
    await pool.query(
      "UPDATE tbluser SET accounts = array_cat(accounts, $1), updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [userAccounts, userId]
    );

    // Tạo mô tả cho giao dịch nạp tiền ban đầu
    const description = account.account_name + " (Nạp tiền ban đầu)";

    // Tạo giao dịch nạp tiền ban đầu vào bảng tbltransaction
    await pool.query(
      "INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6)",
      [userId, description, "income", "Pending", amount, account.account_name]
    );

    // Trả về thông tin tài khoản đã tạo thành công
    res.status(201).json({
      status: true,
      message: account.account_name + " - Tạo tài khoản thành công",
      data: account,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Hàm thêm tiền vào tài khoản
export const addMoneyToAccount = async (req, res) => {
  try {
    // Lấy userId từ thông tin user đã được xác thực
    const { userId } = req.user;

    // Lấy id tài khoản từ URL params
    const { id } = req.params;

    // Lấy số tiền cần thêm từ request body
    const { amount } = req.body;

    // Chuyển đổi amount sang kiểu Number
    const newAmount = Number(amount);

    // Cập nhật số dư tài khoản bằng cách cộng thêm số tiền mới
    const result = await pool.query(
      "UPDATE tblaccount SET account_balance = (account_balance + $1), updatedAt = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [newAmount, id]
    );
    const accountInformation = result.rows[0];

    // Tạo mô tả cho giao dịch nạp tiền
    const description = accountInformation.account_name + " (Nạp tiền)";

    // Tạo giao dịch nạp tiền vào bảng tbltransaction với trạng thái Completed
    await pool.query(
      "INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        userId,
        description,
        "income",
        "Completed",
        amount,
        accountInformation.account_name,
      ]
    );

    // Trả về thông tin tài khoản sau khi nạp tiền thành công
    return res.status(200).json({
      status: true,
      message: "Thêm tiền vào tài khoản thành công",
      data: accountInformation,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
