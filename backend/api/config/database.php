<?php
class Database {

    private $host = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com";
    private $port = "4000";
    private $db_name = "ccs_profiling_db";
    private $username = "2jRXLtAnEIpwtMri.root";
    private $password = "uI9QPTnyEKIrnyPf";

    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,

                // VERY IMPORTANT: Enable SSL for TiDB Cloud
                PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);

        } catch(PDOException $exception) {
            echo "Database Connection Error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>