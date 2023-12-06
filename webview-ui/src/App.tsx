import { filter, first, get, includes, keys, map } from 'lodash';
import { Button, Dialog, Select, Table } from '@alicloud/console-components';
import { Copy, MultiLines, SlidePanel, StatusIndicator, Markdown } from '@xsahxl/ui';
import { vscode, request } from './utils';
import { useState, useEffect } from 'react';
import * as mock from './mock';

interface IItem {
  name: string;
  version: string;
  type: 'dependencies' | 'devDependencies';
  description: string;
  latest: string;
  versions: string[];
  oneVersion: string;
}

function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<IItem[]>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const [record, setRecord] = useState<Record<string, any>>({});
  const XSAHXL_CONFIG = get(window, 'XSAHXL_CONFIG', mock.packageJson);
  const { packageJson, packagePath } = get(XSAHXL_CONFIG, 'data', {} as any);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = [];
      const dependencies = get(packageJson, 'dependencies', {} as any);
      for (const key in dependencies) {
        data.push({
          name: key,
          version: dependencies[key],
          type: 'dependencies',
        });
      }
      const devDependencies = get(packageJson, 'devDependencies', {} as any);
      for (const key in devDependencies) {
        data.push({
          name: key,
          version: devDependencies[key],
          type: 'devDependencies',
        });
      }
      const plist = [];
      for (const item of data) {
        const fn = async () => {
          const response: any = await request(`https://registry.npmjs.org/${item.name}`);
          const latest = get(response, ['dist-tags', 'latest']);
          const versions = filter(keys(get(response, 'versions', {})).reverse(), (v) => v !== latest);
          return {
            ...item,
            description: response.description,
            latest,
            versions,
            oneVersion: first(versions),
            readme: response.readme,
          };
        };
        plist.push(fn());
      }
      const result = await Promise.all(plist);
      setDataSource(result as IItem[]);
    } catch (error) {
      console.log(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [])

  const handleUpdate = (value: string, record: Record<string, any>) => {
    vscode.postMessage({
      eventId: 'update',
      data: {
        name: record.name,
        version: value,
        packagePath,
      },
    });
  };

  const statusRender = (record: Record<string, any>) => {
    const isLatest = includes(record.version, record.latest) || includes(['*', 'latest'], record.version);
    if (isLatest) {
      return (
        <>
          <StatusIndicator type="success" shape="dot">
            latest:
            <span style={{ marginLeft: 4 }}>{record.latest}</span>
          </StatusIndicator>
        </>
      );
    }
    return (
      <>
        <StatusIndicator type="warning" shape="dot">
          latest:
          <span style={{ marginLeft: 4 }}>{record.latest}</span>
          <Button type="primary" text style={{ marginLeft: 8 }} onClick={() => handleUpdate(record.latest, record)}>
            update
          </Button>
        </StatusIndicator>
      </>
    );
  };

  const handleChangeVersion = (value: string, record: Record<string, any>) => {
    const temp = map(dataSource, (item: IItem) => {
      if (item.name === record.name) {
        return {
          ...item,
          oneVersion: value,
        };
      }
      return item;
    });
    setDataSource(temp);
  }

  const handleRemove = (record: Record<string, any>) => {
    Dialog.alert({
      title: 'Remove',
      content: `Are you sure you want to remove ${record.name}?`,
      onOk: () => {
        vscode.postMessage({
          eventId: 'remove',
          data: {
            name: record.name,
            packagePath,
          },
        });
      },
      okProps: { children: 'Yes' },
      cancelProps: { children: 'No' },
    });
  }

  const handleOpenSlide = (record: Record<string, any>) => {
    setRecord(record);
    setVisible(true);
  }

  const columns = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      width: 200,
      lock: 'left',
      cell: (value: string, index: string, record: Record<string, any>) => (
        <Button type='primary' text onClick={() => handleOpenSlide(record)}>
          <Copy text={value} >{value}</Copy>
        </Button>
      ),
    },
    {
      key: 'version',
      title: 'Version',
      dataIndex: 'version',
      width: 240,
      lock: 'left',
      cell: (value: string, index: string, record: Record<string, any>) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ marginRight: 8 }}>{value}</div>
            {statusRender(record)}
          </div>
        );
      },
    },
    {
      key: 'oneVersion',
      title: 'Specify version',
      dataIndex: 'oneVersion',
      width: 180,
      lock: 'left',
      cell: (value: string, index: string, record: Record<string, any>) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Select style={{ flex: 1 }} value={value} dataSource={record.versions} autoWidth={false} onChange={(v) => handleChangeVersion(v, record)}></Select>
            <Button type="primary" text style={{ marginLeft: 8 }} onClick={() => handleUpdate(record.oneVersion, record)}>
              update
            </Button>
          </div>
        );
      },
    },
    {
      key: 'description',
      title: 'Description',
      width: 200,
      dataIndex: 'description',
      cell: (value: string) => <MultiLines lines={2}>{value}</MultiLines>,
    },
    {
      key: 'type',
      title: 'Type',
      width: 120,
      dataIndex: 'type',
    },
    {
      title: 'Operation',
      width: 80,
      cell: (value: string, index: string, record: Record<string, any>) => {
        return (
          <Button type="primary" text onClick={() => handleRemove(record)}>
            remvoe
          </Button>
        );
      },
      lock: 'right'
    },
  ];

  const handleClose = () => {
    setVisible(false);
  }

  return (
    <>
      <Table hasBorder={false} style={{ minHeight: 500 }} loading={loading} dataSource={dataSource} columns={columns} />
      <SlidePanel
        title={record.name}
        isShowing={visible}
        onClose={handleClose}
        onCancel={handleClose}
        width={'large'}
        hasMask={false}
        cancelText="Close"
      >
        {<Markdown>{record.readme}</Markdown>}
      </SlidePanel>
    </>
  );
}

export default App;
