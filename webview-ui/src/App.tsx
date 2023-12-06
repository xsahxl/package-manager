import { filter, first, get, includes, keys, map } from 'lodash';
import { Button, Dialog, Select, Table } from '@alicloud/console-components';
import { Copy, MultiLines, SlidePanel, StatusIndicator, Markdown } from '@xsahxl/ui';
import moment from 'moment';
import numeral from 'numeral';
import { vscode, request } from './utils';
import { useState, useEffect } from 'react';
import * as mock from './mock';
import i18n from './i18n';

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
          const weeklyDownloads = await request(`https://api.npmjs.org/downloads/point/last-week/${item.name}`);
          const latest = get(response, ['dist-tags', 'latest']);
          const versions = filter(keys(get(response, 'versions', {})).reverse(), v => v !== latest);
          return {
            ...item,
            description: response.description,
            latest,
            versions,
            oneVersion: first(versions),
            readme: response.readme,
            modifiedTime: get(response, 'time.modified'),
            weeklyDownloads: numeral(get(weeklyDownloads, 'downloads', 0)).format('0,0'),
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
  }, []);

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
            {i18n('webview.common.update')}
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
  };

  const handleRemove = (record: Record<string, any>) => {
    Dialog.alert({
      title: i18n('webview.common.warning'),
      content: i18n('webview.common.confirm_remove', { name: record.name }),
      onOk: () => {
        vscode.postMessage({
          eventId: 'remove',
          data: {
            name: record.name,
            packagePath,
          },
        });
      },
      okProps: { children: i18n('webview.common.confirm') },
      cancelProps: { children: i18n('webview.common.cancel') },
    });
  };

  const handleOpenSlide = (record: Record<string, any>) => {
    setRecord(record);
    setVisible(true);
  };

  const columns = [
    {
      key: 'name',
      title: i18n('webview.common.name'),
      dataIndex: 'name',
      width: 200,
      lock: 'left',
      cell: (value: string, index: string, record: Record<string, any>) => (
        <Button type="primary" text onClick={() => handleOpenSlide(record)}>
          <Copy text={value}>{value}</Copy>
        </Button>
      ),
    },
    {
      key: 'version',
      title: i18n('webview.common.version'),
      dataIndex: 'version',
      width: 200,
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
      title: i18n('webview.common.specify_version'),
      dataIndex: 'oneVersion',
      width: 180,
      cell: (value: string, index: string, record: Record<string, any>) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Select style={{ flex: 1 }} value={value} dataSource={record.versions} autoWidth={false} onChange={v => handleChangeVersion(v, record)}></Select>
            <Button type="primary" text style={{ marginLeft: 8 }} onClick={() => handleUpdate(record.oneVersion, record)}>
              {i18n('webview.common.update')}
            </Button>
          </div>
        );
      },
    },
    {
      key: 'description',
      title: i18n('webview.common.description'),
      width: 200,
      dataIndex: 'description',
      cell: (value: string) => <MultiLines lines={2}>{value}</MultiLines>,
    },
    {
      key: 'weeklyDownloads',
      title: i18n('webview.common.weekly_downloads'),
      width: 100,
      dataIndex: 'weeklyDownloads',
    },
    {
      key: 'modifiedTime',
      title: i18n('webview.common.modified_time'),
      width: 120,
      dataIndex: 'modifiedTime',
      cell: (value: string) => moment(value).fromNow(),
    },
    {
      key: 'type',
      title: i18n('webview.common.type'),
      width: 120,
      dataIndex: 'type',
      cell: (value: string) => value === 'dependencies' ? i18n('webview.common.dependencies') : i18n('webview.common.dev_dependencies'),
    },
    {
      title: i18n('webview.common.operation'),
      width: 80,
      cell: (value: string, index: string, record: Record<string, any>) => {
        return (
          <Button type="primary" text onClick={() => handleRemove(record)}>
            {i18n('webview.common.remove')}
          </Button>
        );
      },
      lock: 'right',
    },
  ];

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <>
      <Table hasBorder={false} style={{ minHeight: 500 }} loading={loading} dataSource={dataSource} columns={columns} />
      <SlidePanel title={record.name} isShowing={visible} onClose={handleClose} onCancel={handleClose} width={'large'} hasMask={false} cancelText={i18n('webview.common.close')}>
        {<Markdown>{record.readme}</Markdown>}
      </SlidePanel>
    </>
  );
}

export default App;
