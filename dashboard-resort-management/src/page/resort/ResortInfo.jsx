import { useEffect, useState } from "react";
import { Card, Descriptions, Tag, Spin } from "antd";
import { request } from "../../util/request";

export default function ResortInfo() {
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("admin/resorts", "get").then((res) => {
      if (res?.data) setResorts(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <Spin spinning={loading}>
      <h2 className="text-xl font-bold mb-5">Resort Information</h2>
      {resorts.map((resort) => (
        <Card key={resort.id} title={resort.name} className="mb-4">
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Email">{resort.email || "-"}</Descriptions.Item>
            <Descriptions.Item label="Phone">{resort.phone || "-"}</Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>{resort.address || "-"}</Descriptions.Item>
            <Descriptions.Item label="Branches">{resort.branches?.length || 0}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={resort.status === "active" ? "green" : "red"}>
                {resort.status?.charAt(0).toUpperCase() + resort.status?.slice(1)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>{resort.description || "-"}</Descriptions.Item>
          </Descriptions>
        </Card>
      ))}
      {resorts.length === 0 && !loading && (
        <Card><p className="text-gray-400">No resort data found.</p></Card>
      )}
    </Spin>
  );
}
