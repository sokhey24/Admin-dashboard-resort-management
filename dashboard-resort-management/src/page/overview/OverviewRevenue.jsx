import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Spin } from "antd";
import { DollarOutlined, RiseOutlined, CalendarOutlined } from "@ant-design/icons";
import { request } from "../../util/request";

export default function OverviewRevenue() {
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("admin/reports/revenue", "get").then((res) => {
      if (res) setData(res);
      setLoading(false);
    });
  }, []);

  return (
    <Spin spinning={loading}>
      <h2 style={{ marginBottom: 20 }}>Revenue Overview</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="Total Revenue" value={data.total_revenue || 0} prefix={<DollarOutlined />} valueStyle={{ color: "#52c41a" }} precision={2} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="This Month" value={data.revenue_this_month || 0} prefix={<RiseOutlined />} valueStyle={{ color: "#1677ff" }} precision={2} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Today" value={data.revenue_today || 0} prefix={<CalendarOutlined />} valueStyle={{ color: "#faad14" }} precision={2} />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
