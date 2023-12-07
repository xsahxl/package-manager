import { filter, first, get, includes, keys, map, startsWith } from 'lodash';
import { Button, Dialog, Icon, Loading, Select } from '@alicloud/console-components';
import { Copy, SlidePanel, StatusIndicator, Markdown } from '@xsahxl/ui';
import DataFields, { DataFieldsProps } from '@alicloud/console-components-data-fields';
import moment from 'moment';
import numeral from 'numeral';
import { vscode, request } from './utils';
import { useState, useEffect } from 'react';
import * as mock from './mock';
import i18n from './i18n';
import styled from 'styled-components';

interface IItem {
  name: string;
  version: string;
  envType: 'dependencies' | 'devDependencies';
  description: string;
  latest: string;
  versions: string[];
  oneVersion: string;
}

function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<IItem[]>([]);
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
          envType: 'dependencies',
        });
      }
      const devDependencies = get(packageJson, 'devDependencies', {} as any);
      for (const key in devDependencies) {
        data.push({
          name: key,
          version: devDependencies[key],
          envType: 'devDependencies',
        });
      }
      const plist = [];
      for (const item of data) {
        const fn = async () => {
          const response: any = await request(`https://registry.npmmirror.com/${item.name}`);
          const weeklyDownloads = await request(`https://api.npmjs.org/downloads/point/last-week/${item.name}`);
          const latest = get(response, ['dist-tags', 'latest']);
          const versions = filter(keys(get(response, 'versions', {})), v => v !== latest).concat(latest);
          return {
            ...item,
            description: get(response, 'description'),
            latest,
            versions,
            oneVersion: first(versions),
            readme: get(response, 'readme'),
            license: get(response, 'license'),
            modifiedTime: get(response, 'time.modified'),
            created: get(response, 'time.created'),
            weeklyDownloads: numeral(get(weeklyDownloads, 'downloads', 0)).format('0,0'),
          };
        };
        plist.push(fn());
      }
      const result = await Promise.all(plist);
      setData(result as IItem[]);
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

  const latestRender = (record: Record<string, any>) => {
    const isLatest = () => {
      if (includes(record.version, record.latest)) {
        return true;
      }
      if (includes(['*', 'latest'], record.version)) {
        return true;
      }
      if (startsWith(record.version, 'workspace:')) {
        return true;
      }
      return false;
    }
    if (isLatest()) {
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
    const temp = map(data, (item: IItem) => {
      if (item.name === record.name) {
        return {
          ...item,
          oneVersion: value,
        };
      }
      return item;
    });
    setData(temp);
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

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <Loading visible={loading} inline={false} style={{ minHeight: 500 }}>
      {map(data, (dataSource: Record<string, any>) => {
        const items: DataFieldsProps['items'] = [
          {
            dataIndex: 'name',
            render: val => (
              <Button type="primary" text onClick={() => handleOpenSlide(dataSource)} style={{ fontWeight: 500, fontSize: 18 }}>
                <Copy text={val}>{val}</Copy>
              </Button>
            ),
            span: 24,
          },
          {
            dataIndex: 'version',
            label: i18n('webview.common.version'),
          },
          {
            dataIndex: 'license',
            label: i18n('webview.common.license'),
            render: val => (
              <>
                <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{val}</span>
              </>
            ),
          },
          {
            dataIndex: 'latest',
            label: i18n('webview.common.latest'),
            render: () => latestRender(dataSource),
            span: 12,
          },
          {
            dataIndex: 'oneVersion',
            label: i18n('webview.common.specify_version'),
            render: val => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Select showSearch style={{ width: 180 }} value={val} dataSource={dataSource.versions} autoWidth={false} onChange={v => handleChangeVersion(v, dataSource)}></Select>
                <Button type="primary" text style={{ marginLeft: 8 }} onClick={() => handleUpdate(dataSource.oneVersion, dataSource)}>
                  {i18n('webview.common.update')}
                </Button>
              </div>
            ),
            span: 12,
          },
          {
            dataIndex: 'weeklyDownloads',
            label: i18n('webview.common.weekly_downloads'),
            span: 12,
          },
          {
            dataIndex: 'envType',
            label: i18n('webview.common.env_type'),
            render: (value: string) => (value === 'dependencies' ? i18n('webview.common.dependencies') : i18n('webview.common.dev_dependencies')),
            span: 12,
          },
          {
            dataIndex: 'created',
            label: i18n('webview.common.created'),
            render: (value: string) => moment(value).format('YYYY-MM-DD HH:mm:ss'),
            span: 12,
          },
          {
            dataIndex: 'modifiedTime',
            label: i18n('webview.common.modified_time'),
            render: (value: string) => moment(value).fromNow(),
            span: 12,
          },
          {
            dataIndex: 'description',
            label: i18n('webview.common.description'),
            span: 24,
          },
        ];
        return (
          <Container>
            <DataFields style={{ margin: 16 }} dataSource={dataSource} items={items} />
            <Icon className="remove-btn" type="delete" size="xs" onClick={() => handleRemove(dataSource)} />
          </Container>

        );
      })}
      <SlidePanel title={record.name} isShowing={visible} onClose={handleClose} onCancel={handleClose} width={'large'} hasMask={false} cancelText={i18n('webview.common.close')}>
        {<Markdown>{record.readme}</Markdown>}
      </SlidePanel>
    </Loading>

  );
}

const Container = styled.div`
  position: relative;
  .remove-btn {
    position: absolute;
    opacity: 0;
    transition: all 0.3s;
    top: 0;
    right: 16px;
    cursor: pointer;
  }
  &:hover {
    .remove-btn {
      opacity: 1;
    }
  }
`;

export default App;
