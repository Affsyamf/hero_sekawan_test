import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import GeneralInfoCard from "../../components/ui/card/GeneralInfoCard";
import Card from "../../components/ui/card/Card";
import Table from "../../components/ui/table/Table";
import Loading from "../../components/ui/loading/Loading";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { getPurchasingById } from "../../services/purchasing_service";

export default function PurchasingDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await getPurchasingById(id);
        setData(res.data?.data || {});
      } catch (err) {
        console.error("Failed to fetch purchasing details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const columns = [
    {
      key: "product_name",
      label: "Product",
      sortable: true,
      render: (v) => <span className="font-medium text-primary-text">{v}</span>,
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{Number(v || 0)}</span>
      ),
    },
    {
      key: "price",
      label: "Unit Price",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatCurrency(v || 0)}</span>
      ),
    },
    {
      key: "dpp",
      label: "DPP",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatCurrency(v || 0)}</span>
      ),
    },
    {
      key: "ppn",
      label: "PPN",
      sortable: true,
      render: (v, row) => (
        <span className="text-secondary-text">
          {formatCurrency(v * row.quantity || 0)}
        </span>
      ),
    },
    {
      key: "pph",
      label: "PPH",
      sortable: true,
      render: (v) => (
        <span className="text-secondary-text">{formatCurrency(v || 0)}</span>
      ),
    },
  ];

  return (
    <div className="bg-background mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface transition-all cursor-pointer"
          title="Back"
        >
          <ChevronLeft size={22} className="text-secondary-text" />
        </button>
        <h1 className="text-2xl font-bold text-primary-text">
          Purchasing Detail {data?.code ? `#${data.code}` : ""}
        </h1>
      </div>

      {/* Body */}
      {loading ? (
        <Loading fullscreen label="Loading purchasing details..." />
      ) : (
        <div className="flex flex-col gap-6 mt-4">
          {/* General Information */}
          <GeneralInfoCard
            title="General Information"
            items={[
              { label: "Code", value: data.code },
              { label: "Date", value: formatDate(data.date) },
              { label: "Supplier", value: data.supplier_name },
              { label: "Purchase Order", value: data.purchase_order },
              {
                label: "Total DPP",
                value: formatCurrency(
                  data.details?.reduce((sum, d) => sum + (d.dpp || 0), 0)
                ),
              },
              {
                label: "Total PPN",
                value: formatCurrency(
                  data.details?.reduce(
                    (sum, d) => sum + (d.ppn * d.quantity || 0),
                    0
                  )
                ),
              },
            ]}
          />

          {/* Table */}
          <Card title="Purchased Items">
            <Table
              columns={columns}
              data={data.details || []}
              showDateRangeFilter={false}
              pagination={false}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
